"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const stateMachine_1 = require("./stateMachine");
const db_1 = require("./db");
const cricketDb_1 = require("./cricketDb");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// Enable CORS for frontend Vite dev server or standalone clients
app.use((0, cors_1.default)({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express_1.default.json());
// Serve frontend static production build if available
const frontendDist = path_1.default.join(__dirname, '..', '..', 'frontend', 'dist');
app.use(express_1.default.static(frontendDist));
// Initialize State Machine and DBs
const stateMachine = new stateMachine_1.AuctionStateMachine();
const db = db_1.DatabaseManager.getInstance();
const cricketDb = cricketDb_1.CricketDatabaseManager.getInstance();
// Duplex WebSocket Engine with high-performance configuration
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
    pingInterval: 10000,
    pingTimeout: 5000,
    transports: ['websocket', 'polling'],
});
// Hook up state machine broadcasts to all connected clients
stateMachine.subscribe((snapshot) => {
    io.emit('auction:state_update', snapshot);
}, (bid, snapshot) => {
    io.emit('bid:accepted', { bid, snapshot });
}, (phase, message) => {
    io.emit('hammer:tick', { phase, message, timestamp: Date.now() });
});
// REST Diagnostic & Status APIs
app.get('/api/snapshot', (_req, res) => {
    res.json(stateMachine.getSnapshot());
});
app.get('/api/teams', (_req, res) => {
    res.json(db.getAllTeams());
});
app.get('/api/players', (_req, res) => {
    res.json(db.getAllPlayers());
});
app.get('/api/ledger', (_req, res) => {
    res.json(db.getLedger());
});
app.post('/api/reset', (_req, res) => {
    stateMachine.resetAuction();
    res.json({ success: true, message: 'Auction reset to initial state' });
});
app.post('/api/teams', (req, res) => {
    const result = stateMachine.addNewTeam(req.body);
    res.json(result);
});
app.put('/api/teams/:id', (req, res) => {
    const result = stateMachine.updateTeamDetails(req.params.id, req.body);
    res.json(result);
});
app.delete('/api/teams/:id', (req, res) => {
    const result = stateMachine.deleteTeam(req.params.id);
    res.json(result);
});
app.put('/api/players/:id', (req, res) => {
    const result = stateMachine.updatePlayerDetails(req.params.id, req.body);
    res.json(result);
});
app.post('/api/players', (req, res) => {
    const result = stateMachine.addNewPlayer(req.body);
    res.json(result);
});
app.delete('/api/players/:id', (req, res) => {
    const result = stateMachine.deletePlayer(req.params.id);
    res.json(result);
});
app.post('/api/settings/min-base-price', (req, res) => {
    const { amount, applyToAll } = req.body;
    const result = stateMachine.setCommonMinBasePrice(Number(amount), applyToAll !== false);
    res.json(result);
});
app.post('/api/settings/max-purse', (req, res) => {
    const { amount, applyToAll } = req.body;
    const result = stateMachine.setMaxPursePerTeam(Number(amount), applyToAll !== false);
    res.json(result);
});
app.post('/api/settings/total-players', (req, res) => {
    const { slots, applyToAll } = req.body;
    const result = stateMachine.setTotalPlayersPerTeam(Number(slots), applyToAll !== false);
    res.json(result);
});
// ==================== CRICKET TOURNAMENT & SCORING REST APIS ====================
app.get('/api/cricket/tournaments', (_req, res) => {
    res.json(cricketDb.getAllTournaments());
});
app.get('/api/cricket/tournaments/:id', (req, res) => {
    const t = cricketDb.getTournament(req.params.id);
    if (!t)
        return res.status(404).json({ error: 'Tournament not found' });
    res.json(t);
});
app.post('/api/cricket/tournaments', (req, res) => {
    const t = cricketDb.createTournament(req.body);
    res.json(t);
});
app.get('/api/cricket/tournaments/:id/standings', (req, res) => {
    const standings = cricketDb.getTournamentStandings(req.params.id);
    res.json(standings);
});
app.get('/api/cricket/matches/:id', (req, res) => {
    const m = cricketDb.getMatch(req.params.id);
    if (!m)
        return res.status(404).json({ error: 'Match not found' });
    res.json(m);
});
app.post('/api/cricket/matches/:id/toss', (req, res) => {
    const { winnerTeamId, decision } = req.body;
    const match = cricketDb.updateToss(req.params.id, winnerTeamId, decision);
    if (match) {
        io.to(`match:${match.id}`).emit('match:update', match);
        io.emit('tournaments:update');
    }
    res.json({ success: !!match, match });
});
app.post('/api/cricket/matches/:id/start-innings', (req, res) => {
    const { inningsNumber, strikerId, nonStrikerId, bowlerId } = req.body;
    const match = cricketDb.startInnings(req.params.id, inningsNumber, strikerId, nonStrikerId, bowlerId);
    if (match) {
        io.to(`match:${match.id}`).emit('match:update', match);
        io.emit('tournaments:update');
    }
    res.json({ success: !!match, match });
});
app.post('/api/cricket/matches/:id/ball', (req, res) => {
    const result = cricketDb.recordBall(req.params.id, req.body);
    if (result) {
        io.to(`match:${result.match.id}`).emit('match:update', result.match);
        io.to(`match:${result.match.id}`).emit('match:new_ball', result.newBall);
        io.emit('tournaments:update');
    }
    res.json({ success: !!result, match: result?.match });
});
app.post('/api/cricket/matches/:id/undo', (req, res) => {
    const match = cricketDb.undoLastBall(req.params.id);
    if (match) {
        io.to(`match:${match.id}`).emit('match:update', match);
        io.emit('tournaments:update');
    }
    res.json({ success: !!match, match });
});
app.post('/api/cricket/matches/:id/edit-ball', (req, res) => {
    const { ballId, updatedBall } = req.body;
    const match = cricketDb.editBall(req.params.id, ballId, updatedBall);
    if (match) {
        io.to(`match:${match.id}`).emit('match:update', match);
        io.emit('tournaments:update');
    }
    res.json({ success: !!match, match });
});
// SPA fallback for HTML5 routing
app.get('*', (_req, res) => {
    const indexPath = path_1.default.join(frontendDist, 'index.html');
    res.sendFile(indexPath, (err) => {
        if (err) {
            res.send(`
        <html>
          <head><title>Sports Auction Platform Backend</title></head>
          <body style="font-family: system-ui; padding: 40px; background: #0b0f19; color: #f1f5f9;">
            <h1>Real-Time Sports Auction Platform Backend</h1>
            <p>API Server is running on port 4000. WebSocket endpoint ready.</p>
            <p>Frontend UI runs concurrently or via Vite build.</p>
          </body>
        </html>
      `);
        }
    });
});
// WebSocket Connection & Real-Time Event Handlers
io.on('connection', (socket) => {
    // Send immediate state snapshot on connection
    socket.emit('auction:state_update', stateMachine.getSnapshot());
    // Franchise One-Click Bid handler (Sub-50ms Critical Path)
    socket.on('franchise:place_bid', async (data, callback) => {
        const clientReceivedAt = Date.now();
        const { playerId, teamId, bidAmount } = data;
        try {
            const result = await stateMachine.placeBid(playerId, teamId, bidAmount);
            const processingTime = Date.now() - clientReceivedAt;
            if (callback) {
                callback({
                    ...result,
                    latencyMs: processingTime,
                });
            }
        }
        catch (err) {
            if (callback) {
                callback({
                    success: false,
                    reason: err?.message || 'Server error processing bid',
                });
            }
        }
    });
    // Auctioneer Desk Controls
    socket.on('auctioneer:select_player', (data, callback) => {
        const res = stateMachine.selectPlayer(data.playerId);
        if (callback)
            callback(res);
    });
    socket.on('auctioneer:start_bidding', (data, callback) => {
        const duration = data?.timerSeconds || 20;
        const res = stateMachine.startBidding(duration);
        if (callback)
            callback(res);
    });
    socket.on('auctioneer:hammer_strike', async (data, callback) => {
        const res = await stateMachine.hammerStrike(data.action);
        if (callback)
            callback(res);
    });
    socket.on('auctioneer:toggle_pause', (_data, callback) => {
        const res = stateMachine.togglePause();
        if (callback)
            callback(res);
    });
    socket.on('auctioneer:reset', (_data, callback) => {
        const res = stateMachine.resetAuction();
        if (callback)
            callback(res);
    });
    socket.on('auctioneer:update_team', (data, callback) => {
        const res = stateMachine.updateTeamDetails(data.teamId, data);
        if (callback)
            callback(res);
    });
    socket.on('auctioneer:add_team', (data, callback) => {
        const res = stateMachine.addNewTeam(data);
        if (callback)
            callback(res);
    });
    socket.on('auctioneer:delete_team', (data, callback) => {
        const res = stateMachine.deleteTeam(data.teamId);
        if (callback)
            callback(res);
    });
    socket.on('auctioneer:update_player', (data, callback) => {
        const res = stateMachine.updatePlayerDetails(data.playerId, data);
        if (callback)
            callback(res);
    });
    socket.on('auctioneer:add_player', (data, callback) => {
        const res = stateMachine.addNewPlayer(data);
        if (callback)
            callback(res);
    });
    socket.on('auctioneer:delete_player', (data, callback) => {
        const res = stateMachine.deletePlayer(data.playerId);
        if (callback)
            callback(res);
    });
    socket.on('auctioneer:set_min_base_price', (data, callback) => {
        const res = stateMachine.setCommonMinBasePrice(data.amount, data.applyToAll !== false);
        if (callback)
            callback(res);
    });
    socket.on('auctioneer:set_max_purse', (data, callback) => {
        const res = stateMachine.setMaxPursePerTeam(data.amount, data.applyToAll !== false);
        if (callback)
            callback(res);
    });
    socket.on('auctioneer:set_total_players', (data, callback) => {
        const res = stateMachine.setTotalPlayersPerTeam(data.slots, data.applyToAll !== false);
        if (callback)
            callback(res);
    });
    // ==================== CRICKET REAL-TIME SOCKET.IO EVENTS ====================
    socket.on('match:join', ({ matchId }) => {
        socket.join(`match:${matchId}`);
        const match = cricketDb.getMatch(matchId);
        if (match) {
            socket.emit('match:update', match);
        }
    });
    socket.on('match:leave', ({ matchId }) => {
        socket.leave(`match:${matchId}`);
    });
    socket.on('scorer:record_ball', (data, callback) => {
        const result = cricketDb.recordBall(data.matchId, data.ball);
        if (result) {
            io.to(`match:${result.match.id}`).emit('match:update', result.match);
            io.to(`match:${result.match.id}`).emit('match:new_ball', result.newBall);
            io.emit('tournaments:update');
            if (callback)
                callback({ success: true, match: result.match });
        }
        else {
            if (callback)
                callback({ success: false, error: 'Failed to record ball' });
        }
    });
    socket.on('scorer:undo_ball', (data, callback) => {
        const match = cricketDb.undoLastBall(data.matchId);
        if (match) {
            io.to(`match:${match.id}`).emit('match:update', match);
            io.emit('tournaments:update');
            if (callback)
                callback({ success: true, match });
        }
        else {
            if (callback)
                callback({ success: false, error: 'Failed to undo ball' });
        }
    });
    socket.on('scorer:edit_ball', (data, callback) => {
        const match = cricketDb.editBall(data.matchId, data.ballId, data.updatedBall);
        if (match) {
            io.to(`match:${match.id}`).emit('match:update', match);
            io.emit('tournaments:update');
            if (callback)
                callback({ success: true, match });
        }
        else {
            if (callback)
                callback({ success: false, error: 'Failed to edit ball' });
        }
    });
    socket.on('scorer:toss', (data, callback) => {
        const match = cricketDb.updateToss(data.matchId, data.winnerTeamId, data.decision);
        if (match) {
            io.to(`match:${match.id}`).emit('match:update', match);
            io.emit('tournaments:update');
            if (callback)
                callback({ success: true, match });
        }
        else {
            if (callback)
                callback({ success: false });
        }
    });
});
// SPA Client-side route fallback (ensures direct URL routes like /register, /stadium, /franchise work)
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path_1.default.join(frontendDist, 'index.html'));
});
const PORT = Number(process.env.PORT) || 4000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`=====================================================`);
    console.log(`🏏 Real-Time Sports Auction Platform Backend Online`);
    console.log(`🚀 Port: ${PORT}`);
    console.log(`⚡ WebSocket Duplex Engine: Active`);
    console.log(`🔒 ACID Transaction & Mutex Lock Engine: Initialized`);
    console.log(`=====================================================`);
});
