import express, { Request, Response } from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { AuctionStateMachine } from './stateMachine';
import { DatabaseManager } from './db';
import { CricketDatabaseManager } from './cricketDb';

const app = express();
const server = http.createServer(app);

// Enable CORS for frontend Vite dev server or standalone clients
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  })
);
app.use(express.json());

// Serve frontend static production build if available
const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
app.use(express.static(frontendDist));

// Initialize State Machine and DBs
const stateMachine = new AuctionStateMachine();
const db = DatabaseManager.getInstance();
const cricketDb = CricketDatabaseManager.getInstance();

// Duplex WebSocket Engine with high-performance configuration
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingInterval: 10000,
  pingTimeout: 5000,
  transports: ['websocket', 'polling'],
});

// Hook up state machine broadcasts to all connected clients
stateMachine.subscribe(
  (snapshot) => {
    io.emit('auction:state_update', snapshot);
  },
  (bid, snapshot) => {
    io.emit('bid:accepted', { bid, snapshot });
  },
  (phase, message) => {
    io.emit('hammer:tick', { phase, message, timestamp: Date.now() });
  }
);

// REST Diagnostic & Status APIs
app.get('/api/snapshot', (_req: Request, res: Response) => {
  res.json(stateMachine.getSnapshot());
});

app.get('/api/teams', (_req: Request, res: Response) => {
  res.json(db.getAllTeams());
});

app.get('/api/players', (_req: Request, res: Response) => {
  res.json(db.getAllPlayers());
});

app.get('/api/ledger', (_req: Request, res: Response) => {
  res.json(db.getLedger());
});

app.post('/api/reset', (_req: Request, res: Response) => {
  stateMachine.resetAuction();
  res.json({ success: true, message: 'Auction reset to initial state' });
});

app.post('/api/teams', (req: Request, res: Response) => {
  const result = stateMachine.addNewTeam(req.body);
  res.json(result);
});

app.put('/api/teams/:id', (req: Request, res: Response) => {
  const result = stateMachine.updateTeamDetails(req.params.id, req.body);
  res.json(result);
});

app.delete('/api/teams/:id', (req: Request, res: Response) => {
  const result = stateMachine.deleteTeam(req.params.id);
  res.json(result);
});

app.put('/api/players/:id', (req: Request, res: Response) => {
  const result = stateMachine.updatePlayerDetails(req.params.id, req.body);
  res.json(result);
});

app.post('/api/players', (req: Request, res: Response) => {
  const result = stateMachine.addNewPlayer(req.body);
  res.json(result);
});

app.delete('/api/players/:id', (req: Request, res: Response) => {
  const result = stateMachine.deletePlayer(req.params.id);
  res.json(result);
});

app.post('/api/settings/min-base-price', (req: Request, res: Response) => {
  const { amount, applyToAll } = req.body;
  const result = stateMachine.setCommonMinBasePrice(Number(amount), applyToAll !== false);
  res.json(result);
});

app.post('/api/settings/max-purse', (req: Request, res: Response) => {
  const { amount, applyToAll } = req.body;
  const result = stateMachine.setMaxPursePerTeam(Number(amount), applyToAll !== false);
  res.json(result);
});

app.post('/api/settings/total-players', (req: Request, res: Response) => {
  const { slots, applyToAll } = req.body;
  const result = stateMachine.setTotalPlayersPerTeam(Number(slots), applyToAll !== false);
  res.json(result);
});

// ==================== CRICKET TOURNAMENT & SCORING REST APIS ====================
app.get('/api/cricket/tournaments', (_req: Request, res: Response) => {
  res.json(cricketDb.getAllTournaments());
});

app.get('/api/cricket/tournaments/:id', (req: Request, res: Response) => {
  const t = cricketDb.getTournament(req.params.id);
  if (!t) return res.status(404).json({ error: 'Tournament not found' });
  res.json(t);
});

app.post('/api/cricket/tournaments', (req: Request, res: Response) => {
  const t = cricketDb.createTournament(req.body);
  res.json(t);
});

app.get('/api/cricket/tournaments/:id/standings', (req: Request, res: Response) => {
  const standings = cricketDb.getTournamentStandings(req.params.id);
  res.json(standings);
});

app.get('/api/cricket/matches/:id', (req: Request, res: Response) => {
  const m = cricketDb.getMatch(req.params.id);
  if (!m) return res.status(404).json({ error: 'Match not found' });
  res.json(m);
});

app.post('/api/cricket/matches/:id/toss', (req: Request, res: Response) => {
  const { winnerTeamId, decision } = req.body;
  const match = cricketDb.updateToss(req.params.id, winnerTeamId, decision);
  if (match) {
    io.to(`match:${match.id}`).emit('match:update', match);
    io.emit('tournaments:update');
  }
  res.json({ success: !!match, match });
});

app.post('/api/cricket/matches/:id/start-innings', (req: Request, res: Response) => {
  const { inningsNumber, strikerId, nonStrikerId, bowlerId } = req.body;
  const match = cricketDb.startInnings(req.params.id, inningsNumber, strikerId, nonStrikerId, bowlerId);
  if (match) {
    io.to(`match:${match.id}`).emit('match:update', match);
    io.emit('tournaments:update');
  }
  res.json({ success: !!match, match });
});

app.post('/api/cricket/matches/:id/ball', (req: Request, res: Response) => {
  const result = cricketDb.recordBall(req.params.id, req.body);
  if (result) {
    io.to(`match:${result.match.id}`).emit('match:update', result.match);
    io.to(`match:${result.match.id}`).emit('match:new_ball', result.newBall);
    io.emit('tournaments:update');
  }
  res.json({ success: !!result, match: result?.match });
});

app.post('/api/cricket/matches/:id/undo', (req: Request, res: Response) => {
  const match = cricketDb.undoLastBall(req.params.id);
  if (match) {
    io.to(`match:${match.id}`).emit('match:update', match);
    io.emit('tournaments:update');
  }
  res.json({ success: !!match, match });
});

app.post('/api/cricket/matches/:id/edit-ball', (req: Request, res: Response) => {
  const { ballId, updatedBall } = req.body;
  const match = cricketDb.editBall(req.params.id, ballId, updatedBall);
  if (match) {
    io.to(`match:${match.id}`).emit('match:update', match);
    io.emit('tournaments:update');
  }
  res.json({ success: !!match, match });
});

// SPA fallback for HTML5 routing
app.get('*', (_req: Request, res: Response) => {
  const indexPath = path.join(frontendDist, 'index.html');
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
io.on('connection', (socket: Socket) => {
  // Send immediate state snapshot on connection
  socket.emit('auction:state_update', stateMachine.getSnapshot());

  // Franchise One-Click Bid handler (Sub-50ms Critical Path)
  socket.on(
    'franchise:place_bid',
    async (
      data: { playerId: string; teamId: string; bidAmount: number },
      callback?: (res: any) => void
    ) => {
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
      } catch (err: any) {
        if (callback) {
          callback({
            success: false,
            reason: err?.message || 'Server error processing bid',
          });
        }
      }
    }
  );

  // Auctioneer Desk Controls
  socket.on(
    'auctioneer:select_player',
    (data: { playerId: string }, callback?: (res: any) => void) => {
      const res = stateMachine.selectPlayer(data.playerId);
      if (callback) callback(res);
    }
  );

  socket.on(
    'auctioneer:start_bidding',
    (data: { timerSeconds?: number }, callback?: (res: any) => void) => {
      const duration = data?.timerSeconds || 20;
      const res = stateMachine.startBidding(duration);
      if (callback) callback(res);
    }
  );

  socket.on(
    'auctioneer:hammer_strike',
    async (
      data: { action: 'GOING_1' | 'GOING_2' | 'SOLD' | 'UNSOLD' },
      callback?: (res: any) => void
    ) => {
      const res = await stateMachine.hammerStrike(data.action);
      if (callback) callback(res);
    }
  );

  socket.on('auctioneer:toggle_pause', (_data, callback?: (res: any) => void) => {
    const res = stateMachine.togglePause();
    if (callback) callback(res);
  });

  socket.on('auctioneer:reset', (_data, callback?: (res: any) => void) => {
    const res = stateMachine.resetAuction();
    if (callback) callback(res);
  });

  socket.on(
    'auctioneer:update_team',
    (
      data: { teamId: string; name?: string; code?: string; logo?: string; totalPurse?: number; maxSlots?: number },
      callback?: (res: any) => void
    ) => {
      const res = stateMachine.updateTeamDetails(data.teamId, data);
      if (callback) callback(res);
    }
  );

  socket.on(
    'auctioneer:add_team',
    (
      data: {
        name: string;
        code?: string;
        logo?: string;
        primaryColor?: string;
        secondaryColor?: string;
        totalPurse?: number;
        maxSlots?: number;
      },
      callback?: (res: any) => void
    ) => {
      const res = stateMachine.addNewTeam(data);
      if (callback) callback(res);
    }
  );

  socket.on(
    'auctioneer:delete_team',
    (data: { teamId: string }, callback?: (res: any) => void) => {
      const res = stateMachine.deleteTeam(data.teamId);
      if (callback) callback(res);
    }
  );

  socket.on(
    'auctioneer:update_player',
    (
      data: { playerId: string; name?: string; role?: any; basePrice?: number; country?: string },
      callback?: (res: any) => void
    ) => {
      const res = stateMachine.updatePlayerDetails(data.playerId, data);
      if (callback) callback(res);
    }
  );

  socket.on(
    'auctioneer:add_player',
    (
      data: {
        name: string;
        role: any;
        country?: string;
        isOverseas?: boolean;
        basePrice: number;
        avatarUrl?: string;
        stats?: any;
      },
      callback?: (res: any) => void
    ) => {
      const res = stateMachine.addNewPlayer(data);
      if (callback) callback(res);
    }
  );

  socket.on(
    'auctioneer:delete_player',
    (data: { playerId: string }, callback?: (res: any) => void) => {
      const res = stateMachine.deletePlayer(data.playerId);
      if (callback) callback(res);
    }
  );

  socket.on(
    'auctioneer:set_min_base_price',
    (
      data: { amount: number; applyToAll?: boolean },
      callback?: (res: any) => void
    ) => {
      const res = stateMachine.setCommonMinBasePrice(data.amount, data.applyToAll !== false);
      if (callback) callback(res);
    }
  );

  socket.on(
    'auctioneer:set_max_purse',
    (
      data: { amount: number; applyToAll?: boolean },
      callback?: (res: any) => void
    ) => {
      const res = stateMachine.setMaxPursePerTeam(data.amount, data.applyToAll !== false);
      if (callback) callback(res);
    }
  );

  socket.on(
    'auctioneer:set_total_players',
    (
      data: { slots: number; applyToAll?: boolean },
      callback?: (res: any) => void
    ) => {
      const res = stateMachine.setTotalPlayersPerTeam(data.slots, data.applyToAll !== false);
      if (callback) callback(res);
    }
  );

  // ==================== CRICKET REAL-TIME SOCKET.IO EVENTS ====================
  socket.on('match:join', ({ matchId }: { matchId: string }) => {
    socket.join(`match:${matchId}`);
    const match = cricketDb.getMatch(matchId);
    if (match) {
      socket.emit('match:update', match);
    }
  });

  socket.on('match:leave', ({ matchId }: { matchId: string }) => {
    socket.leave(`match:${matchId}`);
  });

  socket.on(
    'scorer:record_ball',
    (data: { matchId: string; ball: any }, callback?: (res: any) => void) => {
      const result = cricketDb.recordBall(data.matchId, data.ball);
      if (result) {
        io.to(`match:${result.match.id}`).emit('match:update', result.match);
        io.to(`match:${result.match.id}`).emit('match:new_ball', result.newBall);
        io.emit('tournaments:update');
        if (callback) callback({ success: true, match: result.match });
      } else {
        if (callback) callback({ success: false, error: 'Failed to record ball' });
      }
    }
  );

  socket.on(
    'scorer:undo_ball',
    (data: { matchId: string }, callback?: (res: any) => void) => {
      const match = cricketDb.undoLastBall(data.matchId);
      if (match) {
        io.to(`match:${match.id}`).emit('match:update', match);
        io.emit('tournaments:update');
        if (callback) callback({ success: true, match });
      } else {
        if (callback) callback({ success: false, error: 'Failed to undo ball' });
      }
    }
  );

  socket.on(
    'scorer:edit_ball',
    (data: { matchId: string; ballId: string; updatedBall: any }, callback?: (res: any) => void) => {
      const match = cricketDb.editBall(data.matchId, data.ballId, data.updatedBall);
      if (match) {
        io.to(`match:${match.id}`).emit('match:update', match);
        io.emit('tournaments:update');
        if (callback) callback({ success: true, match });
      } else {
        if (callback) callback({ success: false, error: 'Failed to edit ball' });
      }
    }
  );

  socket.on(
    'scorer:toss',
    (data: { matchId: string; winnerTeamId: string; decision: any }, callback?: (res: any) => void) => {
      const match = cricketDb.updateToss(data.matchId, data.winnerTeamId, data.decision);
      if (match) {
        io.to(`match:${match.id}`).emit('match:update', match);
        io.emit('tournaments:update');
        if (callback) callback({ success: true, match });
      } else {
        if (callback) callback({ success: false });
      }
    }
  );
});

// SPA Client-side route fallback (ensures direct URL routes like /register, /stadium, /franchise work)
app.get('*', (req: Request, res: Response) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(frontendDist, 'index.html'));
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
