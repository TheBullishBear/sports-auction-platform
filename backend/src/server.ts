import express, { Request, Response } from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { AuctionStateMachine } from './stateMachine';
import { DatabaseManager } from './db';

const app = express();
const server = http.createServer(app);

// Enable CORS for frontend Vite dev server or standalone clients
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST'],
  })
);
app.use(express.json());

// Serve frontend static production build if available
const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
app.use(express.static(frontendDist));

// Initialize State Machine and DB
const stateMachine = new AuctionStateMachine();
const db = DatabaseManager.getInstance();

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

app.put('/api/teams/:id', (req: Request, res: Response) => {
  const result = stateMachine.updateTeamDetails(req.params.id, req.body);
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
});

// SPA Client-side route fallback (ensures direct URL routes like /register, /stadium, /franchise work)
app.get('*', (req: Request, res: Response) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(frontendDist, 'index.html'));
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`=====================================================`);
  console.log(`🏏 Real-Time Sports Auction Platform Backend Online`);
  console.log(`🚀 Port: ${PORT}`);
  console.log(`⚡ WebSocket Duplex Engine: Active`);
  console.log(`🔒 ACID Transaction & Mutex Lock Engine: Initialized`);
  console.log(`=====================================================`);
});
