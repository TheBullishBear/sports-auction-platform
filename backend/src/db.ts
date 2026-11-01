import fs from 'fs';
import path from 'path';
import { Player, Team, BidLedgerEntry, AuctionSession } from './types';

// Mutex / Concurrency Lock for Row-Level atomic operations
class AsyncLock {
  private locks = new Map<string, Promise<void>>();

  async acquire(key: string): Promise<() => void> {
    while (this.locks.has(key)) {
      await this.locks.get(key);
    }

    let release: () => void = () => {};
    const promise = new Promise<void>((resolve) => {
      release = () => {
        this.locks.delete(key);
        resolve();
      };
    });

    this.locks.set(key, promise);
    return release;
  }
}

export class DatabaseManager {
  private static instance: DatabaseManager;
  private teams: Map<string, Team> = new Map();
  private players: Map<string, Player> = new Map();
  private ledger: BidLedgerEntry[] = [];
  private session: AuctionSession;
  private lock = new AsyncLock();
  private ledgerFilePath: string;
  private playersFilePath: string;
  private teamsFilePath: string;

  private constructor() {
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.ledgerFilePath = path.join(dataDir, 'bidding_ledger.jsonl');
    this.playersFilePath = path.join(dataDir, 'players_database.json');
    this.teamsFilePath = path.join(dataDir, 'teams_database.json');

    this.session = {
      id: 'AUCTION-SESSION-2026',
      status: 'IDLE',
      currentPlayerId: null,
      timerSeconds: 20,
      isPaused: false,
      hammerPhase: 0,
      lastBidTimestamp: null,
      lastHighBid: null,
      minBasePrice: 20000000,
      maxPursePerTeam: 1000000000, // Default 100 Cr
      totalPlayersPerTeam: 11, // Default 11 slots
    };

    this.seedDatabase();
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  // Row-Level Locking on Player and Teams for atomic transactional updates
  public async executeBidTransaction<T>(
    playerId: string,
    teamId: string,
    operation: () => Promise<T> | T
  ): Promise<T> {
    // Acquire row-level locks on both the player entity and the team entity
    const releasePlayerLock = await this.lock.acquire(`player:${playerId}`);
    const releaseTeamLock = await this.lock.acquire(`team:${teamId}`);

    try {
      return await operation();
    } finally {
      releaseTeamLock();
      releasePlayerLock();
    }
  }

  // Strict Row Lock for Final Hammer Drop (Sold/Unsold)
  public async executeHammerTransaction<T>(
    playerId: string,
    operation: () => Promise<T> | T
  ): Promise<T> {
    const releasePlayerLock = await this.lock.acquire(`player:${playerId}`);
    try {
      return await operation();
    } finally {
      releasePlayerLock();
    }
  }

  public getSession(): AuctionSession {
    return { ...this.session };
  }

  public updateSession(partial: Partial<AuctionSession>): AuctionSession {
    this.session = { ...this.session, ...partial };
    return { ...this.session };
  }

  public setCommonMinBasePrice(amount: number, applyToAll: boolean = true): { count: number; minBasePrice: number } {
    this.session.minBasePrice = amount;
    let count = 0;
    if (applyToAll) {
      for (const [id, player] of this.players.entries()) {
        if (player.status === 'UPCOMING' || (player.status === 'ON_BLOCK' && player.currentBid === 0)) {
          this.players.set(id, { ...player, basePrice: amount });
          count++;
        }
      }
    }
    if (count > 0) {
      this.persistPlayersToDisk();
    }
    return { count, minBasePrice: amount };
  }

  public setMaxPursePerTeam(amount: number, applyToAll: boolean = true): { count: number; maxPursePerTeam: number } {
    this.session.maxPursePerTeam = amount;
    let count = 0;
    if (applyToAll) {
      for (const [id, team] of this.teams.entries()) {
        const spent = Math.max(0, team.totalPurse - team.remainingPurse);
        const newTotal = amount;
        const newRemaining = Math.max(0, newTotal - spent);
        this.teams.set(id, {
          ...team,
          totalPurse: newTotal,
          remainingPurse: newRemaining,
        });
        count++;
      }
    }
    if (count > 0) {
      this.persistTeamsToDisk();
    }
    return { count, maxPursePerTeam: amount };
  }

  public setTotalPlayersPerTeam(slots: number, applyToAll: boolean = true): { count: number; totalPlayersPerTeam: number } {
    this.session.totalPlayersPerTeam = slots;
    let count = 0;
    if (applyToAll) {
      for (const [id, team] of this.teams.entries()) {
        this.teams.set(id, {
          ...team,
          maxSlots: slots,
          minSlots: Math.min(team.minSlots, slots),
        });
        count++;
      }
    }
    if (count > 0) {
      this.persistTeamsToDisk();
    }
    return { count, totalPlayersPerTeam: slots };
  }

  public getPlayer(id: string): Player | undefined {
    const p = this.players.get(id);
    return p ? { ...p } : undefined;
  }

  public getAllPlayers(): Player[] {
    return Array.from(this.players.values()).sort((a, b) => a.orderIndex - b.orderIndex);
  }

  public persistPlayersToDisk(): void {
    try {
      const allPlayers = this.getAllPlayers();
      fs.writeFileSync(this.playersFilePath, JSON.stringify(allPlayers, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to write players database to disk:', err);
    }
  }

  public updatePlayer(id: string, partial: Partial<Player>): Player {
    const p = this.players.get(id);
    if (!p) throw new Error(`Player ${id} not found`);
    const updated = { ...p, ...partial };
    this.players.set(id, updated);
    this.persistPlayersToDisk();
    return { ...updated };
  }

  public addPlayer(data: {
    name: string;
    age?: number;
    contactNumber?: string;
    email?: string;
    city?: string;
    role: any;
    country?: string;
    isOverseas?: boolean;
    basePrice: number;
    avatarUrl?: string;
    stats?: any;
  }): Player {
    const nextIndex = this.players.size + 1;
    const id = `player-${Date.now()}`;
    const newPlayer: Player = {
      id,
      name: data.name.trim(),
      age: data.age ? Number(data.age) : undefined,
      contactNumber: data.contactNumber ? data.contactNumber.trim() : undefined,
      email: data.email ? data.email.trim() : undefined,
      city: data.city ? data.city.trim() : undefined,
      role: data.role || 'Batter',
      country: data.country ? data.country.trim() : 'India',
      isOverseas: !!data.isOverseas,
      basePrice: data.basePrice,
      currentBid: 0,
      currentHighBidderId: null,
      status: 'UPCOMING',
      soldPrice: null,
      winningTeamId: null,
      avatarUrl:
        data.avatarUrl && data.avatarUrl.trim()
          ? data.avatarUrl.trim()
          : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80',
      orderIndex: nextIndex,
      stats: {
        matches: data.stats?.matches || 0,
        runs: data.stats?.runs,
        strikeRate: data.stats?.strikeRate,
        wickets: data.stats?.wickets,
        economy: data.stats?.economy,
        battingStyle: data.stats?.battingStyle || 'Right-hand bat',
        bowlingStyle: data.stats?.bowlingStyle || 'None',
        highlights: data.stats?.highlights || 'Official registered auction entrant',
      },
    };

    this.players.set(id, newPlayer);
    this.persistPlayersToDisk();
    return { ...newPlayer };
  }

  public deletePlayer(id: string): { success: boolean; deletedPlayer: Player } {
    const p = this.players.get(id);
    if (!p) throw new Error(`Player ${id} not found`);

    // If player was sold to a team, also remove from that team's roster and refund the spent purse
    if (p.status === 'SOLD' && p.winningTeamId && p.soldPrice) {
      const team = this.teams.get(p.winningTeamId);
      if (team) {
        this.teams.set(p.winningTeamId, {
          ...team,
          remainingPurse: team.remainingPurse + p.soldPrice,
          currentSlots: Math.max(0, team.currentSlots - 1),
          currentOverseas: p.isOverseas ? Math.max(0, team.currentOverseas - 1) : team.currentOverseas,
          playersAcquired: team.playersAcquired.filter((rId) => rId !== id),
        });
      }
    }

    // If currently on block, clear session's current player
    if (this.session.currentPlayerId === id) {
      this.session.currentPlayerId = null;
      this.session.status = 'IDLE';
      this.session.lastHighBid = null;
      this.session.lastBidTimestamp = null;
    }

    this.players.delete(id);

    // Re-index remaining players orderIndex
    const sorted = Array.from(this.players.values()).sort((a, b) => a.orderIndex - b.orderIndex);
    sorted.forEach((pl, idx) => {
      pl.orderIndex = idx + 1;
      this.players.set(pl.id, pl);
    });

    this.persistPlayersToDisk();
    return { success: true, deletedPlayer: p };
  }

  public getTeam(id: string): Team | undefined {
    const t = this.teams.get(id);
    return t ? { ...t, playersAcquired: [...t.playersAcquired] } : undefined;
  }

  public getAllTeams(): Team[] {
    return Array.from(this.teams.values());
  }

  public persistTeamsToDisk(): void {
    try {
      const allTeams = this.getAllTeams();
      fs.writeFileSync(this.teamsFilePath, JSON.stringify(allTeams, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to write teams database to disk:', err);
    }
  }

  public addTeam(data: {
    name: string;
    code?: string;
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
    totalPurse?: number;
    maxSlots?: number;
  }): Team {
    const id = `team-${Date.now()}`;
    const code = (data.code && data.code.trim())
      ? data.code.trim().toUpperCase()
      : (data.name.trim().substring(0, 3).toUpperCase());
    const totalPurse = data.totalPurse || this.session.maxPursePerTeam || 1000000000;
    const maxSlots = data.maxSlots || this.session.totalPlayersPerTeam || 11;

    // Palette of vibrant sports franchise colors
    const colors = ['#0284c7', '#7c3aed', '#db2777', '#059669', '#d97706', '#dc2626', '#4f46e5', '#0891b2', '#f59e0b'];
    const assignedColor = data.primaryColor || colors[this.teams.size % colors.length];

    const newTeam: Team = {
      id,
      name: data.name.trim(),
      code,
      logo: (data.logo && data.logo.trim())
        ? data.logo.trim()
        : 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=120&q=80',
      primaryColor: assignedColor,
      secondaryColor: data.secondaryColor || '#ffffff',
      totalPurse,
      remainingPurse: totalPurse,
      maxSlots,
      minSlots: maxSlots,
      currentSlots: 0,
      maxOverseas: 4,
      currentOverseas: 0,
      playersAcquired: [],
    };

    this.teams.set(id, newTeam);
    this.persistTeamsToDisk();
    return { ...newTeam };
  }

  public deleteTeam(id: string): { success: boolean; deletedTeam: Team } {
    const team = this.teams.get(id);
    if (!team) throw new Error(`Team ${id} not found`);

    if (this.teams.size <= 1) {
      throw new Error(`Cannot delete the only remaining franchise team. At least 1 team must exist.`);
    }

    // Release any players won by this team back to the auction pool as upcoming
    let playersChanged = false;
    for (const [pId, p] of this.players.entries()) {
      if (p.winningTeamId === id) {
        this.players.set(pId, {
          ...p,
          status: 'UPCOMING',
          winningTeamId: null,
          soldPrice: null,
          currentBid: 0,
          currentHighBidderId: null,
        });
        playersChanged = true;
      }
    }
    if (playersChanged) {
      this.persistPlayersToDisk();
    }

    // If currently on block and this team is the current high bidder, clear high bidder
    if (this.session.currentPlayerId) {
      const activePlayer = this.players.get(this.session.currentPlayerId);
      if (activePlayer && activePlayer.currentHighBidderId === id) {
        this.players.set(activePlayer.id, {
          ...activePlayer,
          currentBid: 0,
          currentHighBidderId: null,
        });
        this.session.lastHighBid = null;
        this.session.lastBidTimestamp = null;
        if (this.session.status === 'HAMMER_GOING_1' || this.session.status === 'HAMMER_GOING_2') {
          this.session.status = 'BIDDING_ACTIVE';
        }
      }
    }

    this.teams.delete(id);
    this.persistTeamsToDisk();
    return { success: true, deletedTeam: team };
  }

  public updateTeam(id: string, partial: Partial<Team>): Team {
    const t = this.teams.get(id);
    if (!t) throw new Error(`Team ${id} not found`);

    // Strict purse constraint: DIGITAL PURSE CANNOT BE OVERDRAWN
    if (partial.remainingPurse !== undefined && partial.remainingPurse < 0) {
      throw new Error(`CRITICAL INTEGRITY VIOLATION: Team ${t.code} purse cannot be negative! (${partial.remainingPurse})`);
    }

    const updated = { ...t, ...partial };
    this.teams.set(id, updated);
    this.persistTeamsToDisk();
    return { ...updated };
  }

  public appendLedgerEntry(entry: BidLedgerEntry): void {
    this.ledger.push(entry);
    // Persist to immutable append-only JSONL
    try {
      fs.appendFileSync(this.ledgerFilePath, JSON.stringify(entry) + '\n', 'utf8');
    } catch (err) {
      console.error('Failed to write to ledger log:', err);
    }
  }

  public getLedger(): BidLedgerEntry[] {
    return [...this.ledger];
  }

  public getBidsForPlayer(playerId: string): BidLedgerEntry[] {
    return this.ledger.filter((b) => b.playerId === playerId);
  }

  public seedDatabase(): void {
    this.teams.clear();
    this.players.clear();
    this.ledger = [];

    const seededTeams: Team[] = [
      {
        id: 'team-mi',
        name: 'Mumbai Indians',
        code: 'MI',
        logo: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=120&q=80',
        primaryColor: '#004BA0',
        secondaryColor: '#D1AB3E',
        totalPurse: 1000000000, // 100 Cr
        remainingPurse: 1000000000,
        maxSlots: 11,
        minSlots: 11,
        currentSlots: 0,
        maxOverseas: 4,
        currentOverseas: 0,
        playersAcquired: [],
      },
      {
        id: 'team-csk',
        name: 'Chennai Super Kings',
        code: 'CSK',
        logo: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=120&q=80',
        primaryColor: '#FDB913',
        secondaryColor: '#0081E9',
        totalPurse: 1000000000,
        remainingPurse: 1000000000,
        maxSlots: 11,
        minSlots: 11,
        currentSlots: 0,
        maxOverseas: 4,
        currentOverseas: 0,
        playersAcquired: [],
      },
      {
        id: 'team-rcb',
        name: 'Royal Challengers Bengaluru',
        code: 'RCB',
        logo: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=120&q=80',
        primaryColor: '#EC1C24',
        secondaryColor: '#000000',
        totalPurse: 1000000000,
        remainingPurse: 1000000000,
        maxSlots: 11,
        minSlots: 11,
        currentSlots: 0,
        maxOverseas: 4,
        currentOverseas: 0,
        playersAcquired: [],
      },
      {
        id: 'team-kkr',
        name: 'Kolkata Knight Riders',
        code: 'KKR',
        logo: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=120&q=80',
        primaryColor: '#3A225D',
        secondaryColor: '#B3995D',
        totalPurse: 1000000000,
        remainingPurse: 1000000000,
        maxSlots: 11,
        minSlots: 11,
        currentSlots: 0,
        maxOverseas: 4,
        currentOverseas: 0,
        playersAcquired: [],
      },
      {
        id: 'team-gt',
        name: 'Gujarat Titans',
        code: 'GT',
        logo: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=120&q=80',
        primaryColor: '#1B2133',
        secondaryColor: '#CCA04D',
        totalPurse: 1000000000,
        remainingPurse: 1000000000,
        maxSlots: 11,
        minSlots: 11,
        currentSlots: 0,
        maxOverseas: 4,
        currentOverseas: 0,
        playersAcquired: [],
      },
      {
        id: 'team-srh',
        name: 'Sunrisers Hyderabad',
        code: 'SRH',
        logo: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=120&q=80',
        primaryColor: '#F26522',
        secondaryColor: '#000000',
        totalPurse: 1000000000,
        remainingPurse: 1000000000,
        maxSlots: 11,
        minSlots: 11,
        currentSlots: 0,
        maxOverseas: 4,
        currentOverseas: 0,
        playersAcquired: [],
      },
      {
        id: 'team-dc',
        name: 'Delhi Capitals',
        code: 'DC',
        logo: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=120&q=80',
        primaryColor: '#004C97',
        secondaryColor: '#EF4123',
        totalPurse: 1000000000,
        remainingPurse: 1000000000,
        maxSlots: 11,
        minSlots: 11,
        currentSlots: 0,
        maxOverseas: 4,
        currentOverseas: 0,
        playersAcquired: [],
      },
      {
        id: 'team-rr',
        name: 'Rajasthan Royals',
        code: 'RR',
        logo: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=120&q=80',
        primaryColor: '#EA1A85',
        secondaryColor: '#004B8C',
        totalPurse: 1000000000,
        remainingPurse: 1000000000,
        maxSlots: 11,
        minSlots: 11,
        currentSlots: 0,
        maxOverseas: 4,
        currentOverseas: 0,
        playersAcquired: [],
      },
    ];

    // Try restoring teams from disk if available
    if (fs.existsSync(this.teamsFilePath)) {
      try {
        const raw = fs.readFileSync(this.teamsFilePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          for (const team of parsed) {
            this.teams.set(team.id, team);
          }
        }
      } catch (err) {
        console.error('Failed to load teams from disk:', err);
      }
    }

    if (this.teams.size === 0) {
      for (const team of seededTeams) {
        this.teams.set(team.id, team);
      }
      this.persistTeamsToDisk();
    }

    const seededPlayers: Player[] = [
      {
        id: 'player-1',
        name: 'Virat Kohli',
        country: 'India',
        role: 'Batter',
        isOverseas: false,
        basePrice: 20000000, // 2 Cr
        currentBid: 0,
        currentHighBidderId: null,
        status: 'UPCOMING',
        soldPrice: null,
        winningTeamId: null,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80',
        orderIndex: 1,
        stats: {
          matches: 252,
          runs: 8004,
          strikeRate: 131.9,
          highlights: 'Highest run scorer in IPL history with 8 centuries',
        },
      },
      {
        id: 'player-2',
        name: 'Jasprit Bumrah',
        country: 'India',
        role: 'Bowler',
        isOverseas: false,
        basePrice: 20000000, // 2 Cr
        currentBid: 0,
        currentHighBidderId: null,
        status: 'UPCOMING',
        soldPrice: null,
        winningTeamId: null,
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=240&q=80',
        orderIndex: 2,
        stats: {
          matches: 133,
          wickets: 165,
          economy: 7.3,
          highlights: 'World-renowned death-overs specialist and yorker maestro',
        },
      },
      {
        id: 'player-3',
        name: 'Travis Head',
        country: 'Australia',
        role: 'Batter',
        isOverseas: true,
        basePrice: 20000000, // 2 Cr
        currentBid: 0,
        currentHighBidderId: null,
        status: 'UPCOMING',
        soldPrice: null,
        winningTeamId: null,
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80',
        orderIndex: 3,
        stats: {
          matches: 65,
          runs: 1980,
          strikeRate: 174.5,
          highlights: 'Explosive powerplay destructive opener with World Cup Final heroics',
        },
      },
      {
        id: 'player-4',
        name: 'Rashid Khan',
        country: 'Afghanistan',
        role: 'Bowler',
        isOverseas: true,
        basePrice: 20000000, // 2 Cr
        currentBid: 0,
        currentHighBidderId: null,
        status: 'UPCOMING',
        soldPrice: null,
        winningTeamId: null,
        avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=240&q=80',
        orderIndex: 4,
        stats: {
          matches: 121,
          wickets: 149,
          economy: 6.82,
          highlights: 'Premier T20 leg spinner globally with deceptive quick googly',
        },
      },
      {
        id: 'player-5',
        name: 'Heinrich Klaasen',
        country: 'South Africa',
        role: 'Wicketkeeper',
        isOverseas: true,
        basePrice: 15000000, // 1.5 Cr
        currentBid: 0,
        currentHighBidderId: null,
        status: 'UPCOMING',
        soldPrice: null,
        winningTeamId: null,
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=240&q=80',
        orderIndex: 5,
        stats: {
          matches: 48,
          runs: 1450,
          strikeRate: 178.2,
          highlights: 'Most lethal spin crusher in contemporary limited overs cricket',
        },
      },
      {
        id: 'player-6',
        name: 'Hardik Pandya',
        country: 'India',
        role: 'All-Rounder',
        isOverseas: false,
        basePrice: 20000000, // 2 Cr
        currentBid: 0,
        currentHighBidderId: null,
        status: 'UPCOMING',
        soldPrice: null,
        winningTeamId: null,
        avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=240&q=80',
        orderIndex: 6,
        stats: {
          matches: 137,
          runs: 2525,
          wickets: 64,
          strikeRate: 146.0,
          economy: 8.8,
          highlights: 'Fast bowling all-rounder & clutch World Cup match winner',
        },
      },
      {
        id: 'player-7',
        name: 'Mitchell Starc',
        country: 'Australia',
        role: 'Bowler',
        isOverseas: true,
        basePrice: 20000000, // 2 Cr
        currentBid: 0,
        currentHighBidderId: null,
        status: 'UPCOMING',
        soldPrice: null,
        winningTeamId: null,
        avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=240&q=80',
        orderIndex: 7,
        stats: {
          matches: 42,
          wickets: 51,
          economy: 7.9,
          highlights: 'Record-holding left-arm tearaway fast bowler in IPL history',
        },
      },
      {
        id: 'player-8',
        name: 'Rishabh Pant',
        country: 'India',
        role: 'Wicketkeeper',
        isOverseas: false,
        basePrice: 20000000, // 2 Cr
        currentBid: 0,
        currentHighBidderId: null,
        status: 'UPCOMING',
        soldPrice: null,
        winningTeamId: null,
        avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=240&q=80',
        orderIndex: 8,
        stats: {
          matches: 111,
          runs: 3284,
          strikeRate: 148.9,
          highlights: 'Fearless match-winning wicketkeeper-batter with audacious strokeplay',
        },
      },
      {
        id: 'player-9',
        name: 'Sunil Narine',
        country: 'West Indies',
        role: 'All-Rounder',
        isOverseas: true,
        basePrice: 15000000, // 1.5 Cr
        currentBid: 0,
        currentHighBidderId: null,
        status: 'UPCOMING',
        soldPrice: null,
        winningTeamId: null,
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=240&q=80',
        orderIndex: 9,
        stats: {
          matches: 177,
          runs: 1534,
          wickets: 180,
          strikeRate: 165.8,
          economy: 6.73,
          highlights: 'MVP 2024 champion with pinch-hitting blitzkrieg and mystery spin',
        },
      },
      {
        id: 'player-10',
        name: 'Rinku Singh',
        country: 'India',
        role: 'Batter',
        isOverseas: false,
        basePrice: 10000000, // 1 Cr
        currentBid: 0,
        currentHighBidderId: null,
        status: 'UPCOMING',
        soldPrice: null,
        winningTeamId: null,
        avatarUrl: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=240&q=80',
        orderIndex: 10,
        stats: {
          matches: 46,
          runs: 893,
          strikeRate: 143.3,
          highlights: 'Iconic 5 consecutive sixes finisher with nerves of steel',
        },
      },
    ];

    for (const player of seededPlayers) {
      this.players.set(player.id, player);
    }
    this.persistPlayersToDisk();
  }
}
