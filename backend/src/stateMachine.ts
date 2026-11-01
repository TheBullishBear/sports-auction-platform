import { DatabaseManager } from './db';
import { BidRulesEngine } from './rulesEngine';
import {
  Player,
  Team,
  BidLedgerEntry,
  AuctionSession,
  LiveStateSnapshot,
  AuctionStatus,
} from './types';

export type StateChangeCallback = (snapshot: LiveStateSnapshot) => void;
export type BidAcceptedCallback = (entry: BidLedgerEntry, snapshot: LiveStateSnapshot) => void;
export type HammerTickCallback = (phase: string, message: string) => void;

export class AuctionStateMachine {
  private db: DatabaseManager;
  private timerInterval: NodeJS.Timeout | null = null;
  private onStateChange: StateChangeCallback | null = null;
  private onBidAccepted: BidAcceptedCallback | null = null;
  private onHammerTick: HammerTickCallback | null = null;
  private recentSales: { player: Player; team: Team; price: number; timestamp: number }[] = [];

  constructor() {
    this.db = DatabaseManager.getInstance();
  }

  public subscribe(
    onStateChange: StateChangeCallback,
    onBidAccepted: BidAcceptedCallback,
    onHammerTick: HammerTickCallback
  ): void {
    this.onStateChange = onStateChange;
    this.onBidAccepted = onBidAccepted;
    this.onHammerTick = onHammerTick;
  }

  public getSnapshot(): LiveStateSnapshot {
    const session = this.db.getSession();
    const currentPlayer = session.currentPlayerId ? this.db.getPlayer(session.currentPlayerId) || null : null;
    const currentHighBid = session.lastHighBid;
    const nextMinimumBid = currentPlayer ? BidRulesEngine.calculateNextMinimumBid(currentPlayer) : 0;
    const nextIncrement = currentPlayer
      ? BidRulesEngine.calculateIncrement(currentPlayer.currentBid, currentPlayer.basePrice)
      : 0;
    const bidHistory = currentPlayer ? this.db.getBidsForPlayer(currentPlayer.id) : [];

    return {
      session,
      currentPlayer,
      currentHighBid,
      nextMinimumBid,
      nextIncrement,
      bidHistory,
      teams: this.db.getAllTeams(),
      playersQueue: this.db.getAllPlayers(),
      recentSales: [...this.recentSales],
    };
  }

  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange(this.getSnapshot());
    }
  }

  // Action 1: Auctioneer selects next player to put on the block
  public selectPlayer(playerId: string): { success: boolean; message: string } {
    const player = this.db.getPlayer(playerId);
    if (!player) {
      return { success: false, message: `Player with id ${playerId} not found.` };
    }

    if (player.status === 'SOLD') {
      return { success: false, message: `Player ${player.name} has already been sold.` };
    }

    this.stopTimer();

    // Reset previous on-block player if any
    const currentSession = this.db.getSession();
    if (currentSession.currentPlayerId && currentSession.currentPlayerId !== playerId) {
      const prevPlayer = this.db.getPlayer(currentSession.currentPlayerId);
      if (prevPlayer && prevPlayer.status === 'ON_BLOCK') {
        this.db.updatePlayer(prevPlayer.id, { status: 'UPCOMING' });
      }
    }

    // Set new player on block
    this.db.updatePlayer(playerId, {
      status: 'ON_BLOCK',
      currentBid: 0,
      currentHighBidderId: null,
    });

    this.db.updateSession({
      status: 'BID_PENDING',
      currentPlayerId: playerId,
      timerSeconds: 0,
      isPaused: false,
      hammerPhase: 0,
      lastHighBid: null,
    });

    this.notifyStateChange();
    return { success: true, message: `${player.name} is now on the auction block.` };
  }

  // Action 2: Auctioneer starts bidding (manual floor control without automated timer)
  public startBidding(_timerDuration?: number): { success: boolean; message: string } {
    const session = this.db.getSession();
    if (!session.currentPlayerId) {
      return { success: false, message: 'No player is currently selected on the block.' };
    }

    const player = this.db.getPlayer(session.currentPlayerId);
    if (!player) {
      return { success: false, message: 'Selected player does not exist.' };
    }

    this.stopTimer();

    this.db.updateSession({
      status: 'BIDDING_ACTIVE',
      timerSeconds: 0,
      isPaused: false,
      hammerPhase: 0,
    });

    this.notifyStateChange();

    return { success: true, message: `Bidding opened for ${player.name}.` };
  }

  // Action 3: Team places a bid with sub-50ms latency & atomic row lock
  public async placeBid(
    playerId: string,
    teamId: string,
    bidAmount: number
  ): Promise<{ success: boolean; reason?: string; bid?: BidLedgerEntry }> {
    const startTime = Date.now();

    return await this.db.executeBidTransaction(playerId, teamId, async () => {
      const session = this.db.getSession();
      const player = this.db.getPlayer(playerId);
      const team = this.db.getTeam(teamId);

      if (!player) {
        return { success: false, reason: `Player ${playerId} not found.` };
      }
      if (!team) {
        return { success: false, reason: `Team ${teamId} not found.` };
      }

      // Strict validation through Rules Engine
      const validation = BidRulesEngine.validateBid(player, team, session, bidAmount);
      if (!validation.valid) {
        return { success: false, reason: validation.reason };
      }

      // Successful Bid Commit
      const bidsForPlayer = this.db.getBidsForPlayer(playerId);
      const sequence = bidsForPlayer.length + 1;

      const ledgerEntry: BidLedgerEntry = {
        id: `bid-${Date.now()}-${sequence}`,
        auctionId: session.id,
        playerId: player.id,
        teamId: team.id,
        teamName: team.name,
        teamCode: team.code,
        teamColor: team.primaryColor,
        bidAmount,
        bidSequence: sequence,
        timestamp: Date.now(),
        serverLatencyMs: Date.now() - startTime,
      };

      // Atomic state updates
      this.db.appendLedgerEntry(ledgerEntry);
      this.db.updatePlayer(playerId, {
        currentBid: bidAmount,
        currentHighBidderId: team.id,
      });

      this.db.updateSession({
        status: 'BIDDING_ACTIVE',
        hammerPhase: 0,
        lastBidTimestamp: Date.now(),
        lastHighBid: ledgerEntry,
      });

      const snapshot = this.getSnapshot();

      if (this.onBidAccepted) {
        this.onBidAccepted(ledgerEntry, snapshot);
      }
      this.notifyStateChange();

      return { success: true, bid: ledgerEntry };
    });
  }

  // Action 4: Hammer strikes ('GOING_1', 'GOING_2', 'SOLD', 'UNSOLD')
  public async hammerStrike(
    action: 'GOING_1' | 'GOING_2' | 'SOLD' | 'UNSOLD'
  ): Promise<{ success: boolean; message: string }> {
    const session = this.db.getSession();
    if (!session.currentPlayerId) {
      return { success: false, message: 'No player on the auction block.' };
    }

    const playerId = session.currentPlayerId;

    return await this.db.executeHammerTransaction(playerId, async () => {
      const player = this.db.getPlayer(playerId);
      if (!player) return { success: false, message: 'Player not found.' };

      if (action === 'GOING_1') {
        this.db.updateSession({ status: 'HAMMER_GOING_1', hammerPhase: 1 });
        if (this.onHammerTick) this.onHammerTick('GOING_1', `Going Once for ₹${(player.currentBid / 10000000).toFixed(2)} Cr!`);
        this.notifyStateChange();
        return { success: true, message: 'Going once.' };
      }

      if (action === 'GOING_2') {
        this.db.updateSession({ status: 'HAMMER_GOING_2', hammerPhase: 2 });
        if (this.onHammerTick) this.onHammerTick('GOING_2', `Going Twice for ₹${(player.currentBid / 10000000).toFixed(2)} Cr! Final Call!`);
        this.notifyStateChange();
        return { success: true, message: 'Going twice.' };
      }

      if (action === 'SOLD') {
        if (!player.currentHighBidderId || player.currentBid === 0) {
          return { success: false, message: 'Cannot mark as SOLD without any valid bids placed.' };
        }

        const winningTeam = this.db.getTeam(player.currentHighBidderId);
        if (!winningTeam) {
          return { success: false, message: 'Winning team could not be resolved.' };
        }

        // ATOMIC SETTLEMENT & DIGITAL PURSE DEBIT
        const newPurse = winningTeam.remainingPurse - player.currentBid;
        if (newPurse < 0) {
          return { success: false, message: 'PURSE OVERDRAFT PREVENTED: Transaction aborted.' };
        }

        const newSlots = winningTeam.currentSlots + 1;
        const newOverseas = player.isOverseas ? winningTeam.currentOverseas + 1 : winningTeam.currentOverseas;
        const acquired = [...winningTeam.playersAcquired, player.id];

        this.db.updateTeam(winningTeam.id, {
          remainingPurse: newPurse,
          currentSlots: newSlots,
          currentOverseas: newOverseas,
          playersAcquired: acquired,
        });

        const updatedPlayer = this.db.updatePlayer(player.id, {
          status: 'SOLD',
          soldPrice: player.currentBid,
          winningTeamId: winningTeam.id,
        });

        this.stopTimer();

        this.db.updateSession({
          status: 'SOLD',
          hammerPhase: 3,
        });

        this.recentSales.unshift({
          player: updatedPlayer,
          team: winningTeam,
          price: player.currentBid,
          timestamp: Date.now(),
        });

        if (this.onHammerTick) {
          this.onHammerTick(
            'SOLD',
            `SOLD! ${player.name} joins ${winningTeam.name} for ₹${(player.currentBid / 10000000).toFixed(2)} Cr!`
          );
        }

        this.notifyStateChange();
        return { success: true, message: `${player.name} officially SOLD to ${winningTeam.name}.` };
      }

      if (action === 'UNSOLD') {
        const updatedPlayer = this.db.updatePlayer(player.id, {
          status: 'UNSOLD',
          soldPrice: null,
          winningTeamId: null,
        });

        this.stopTimer();

        this.db.updateSession({
          status: 'UNSOLD',
          hammerPhase: 3,
        });

        if (this.onHammerTick) {
          this.onHammerTick('UNSOLD', `${player.name} passes through UNSOLD.`);
        }

        this.notifyStateChange();
        return { success: true, message: `${player.name} marked as UNSOLD.` };
      }

      return { success: false, message: 'Unknown hammer action.' };
    });
  }

  // Action 5: Pause or Resume Countdown Timer
  public togglePause(): { success: boolean; isPaused: boolean } {
    const session = this.db.getSession();
    const newPaused = !session.isPaused;
    this.db.updateSession({ isPaused: newPaused });
    this.notifyStateChange();
    return { success: true, isPaused: newPaused };
  }

  // Action 6: Reset the entire auction to initial seed state
  public resetAuction(): { success: boolean } {
    this.stopTimer();
    this.db.seedDatabase();
    this.recentSales = [];
    this.db.updateSession({
      status: 'IDLE',
      currentPlayerId: null,
      timerSeconds: 20,
      isPaused: false,
      hammerPhase: 0,
      lastHighBid: null,
      lastBidTimestamp: null,
    });
    this.notifyStateChange();
    return { success: true };
  }

  // Action 7: Auctioneer edits team name, code, and logo
  public updateTeamDetails(
    teamId: string,
    updates: { name?: string; code?: string; logo?: string; totalPurse?: number; maxSlots?: number }
  ): { success: boolean; message: string; team?: Team } {
    const team = this.db.getTeam(teamId);
    if (!team) {
      return { success: false, message: `Team ${teamId} not found.` };
    }

    const partial: Partial<Team> = {};
    if (updates.name && updates.name.trim()) partial.name = updates.name.trim();
    if (updates.code && updates.code.trim()) partial.code = updates.code.trim().toUpperCase();
    if (updates.logo && updates.logo.trim()) partial.logo = updates.logo.trim();
    if (updates.totalPurse !== undefined && updates.totalPurse > 0) {
      const diff = updates.totalPurse - team.totalPurse;
      partial.totalPurse = updates.totalPurse;
      partial.remainingPurse = Math.max(0, team.remainingPurse + diff);
    }
    if (updates.maxSlots !== undefined && updates.maxSlots > 0) {
      partial.maxSlots = updates.maxSlots;
      partial.minSlots = Math.min(team.minSlots, updates.maxSlots);
    }

    const updated = this.db.updateTeam(teamId, partial);
    this.notifyStateChange();
    return { success: true, message: `Team ${updated.name} updated successfully.`, team: updated };
  }

  // Action 8: Auctioneer edits player name, role, basePrice, country
  public updatePlayerDetails(
    playerId: string,
    updates: { name?: string; role?: any; basePrice?: number; country?: string }
  ): { success: boolean; message: string; player?: Player } {
    const player = this.db.getPlayer(playerId);
    if (!player) {
      return { success: false, message: `Player ${playerId} not found.` };
    }

    const partial: Partial<Player> = {};
    if (updates.name && updates.name.trim()) partial.name = updates.name.trim();
    if (updates.role) partial.role = updates.role;
    if (updates.country && updates.country.trim()) partial.country = updates.country.trim();
    if (updates.basePrice !== undefined && updates.basePrice > 0) partial.basePrice = updates.basePrice;

    const updated = this.db.updatePlayer(playerId, partial);
    this.notifyStateChange();
    return { success: true, message: `Player ${updated.name} updated successfully.`, player: updated };
  }

  // Action 9: Auctioneer registers a new player into the auction
  public addNewPlayer(
    data: {
      name: string;
      age?: number;
      contactNumber?: string;
      email?: string;
      city?: string;
      role: any;
      country?: string;
      isOverseas?: boolean;
      basePrice?: number;
      avatarUrl?: string;
      stats?: any;
    }
  ): { success: boolean; message: string; player?: Player } {
    if (!data.name || !data.name.trim()) {
      return { success: false, message: 'Player name is required.' };
    }

    const session = this.db.getSession();
    const resolvedBasePrice =
      data.basePrice && data.basePrice > 0
        ? data.basePrice
        : (session.minBasePrice || 20000000);

    const player = this.db.addPlayer({
      ...data,
      basePrice: resolvedBasePrice,
    });
    this.notifyStateChange();
    return {
      success: true,
      message: `${player.name} added to auction pool as Lot #${player.orderIndex}!`,
      player,
    };
  }

  // Action 9B: Auctioneer deletes a player from the auction roster
  public deletePlayer(playerId: string): { success: boolean; message: string; deletedPlayer?: Player } {
    const existing = this.db.getPlayer(playerId);
    if (!existing) {
      return { success: false, message: `Player ${playerId} not found.` };
    }

    const { deletedPlayer } = this.db.deletePlayer(playerId);
    this.notifyStateChange();
    return {
      success: true,
      message: `Player "${deletedPlayer.name}" removed from the auction roster.`,
      deletedPlayer,
    };
  }

  // Action 10: Set common minimum base price for players
  public setCommonMinBasePrice(
    amount: number,
    applyToAll: boolean = true
  ): { success: boolean; message: string; minBasePrice: number; affectedCount: number } {
    if (!amount || amount <= 0) {
      return { success: false, message: 'Invalid minimum base price provided.', minBasePrice: 0, affectedCount: 0 };
    }
    const result = this.db.setCommonMinBasePrice(amount, applyToAll);
    this.notifyStateChange();

    const formatted =
      amount >= 10000000
        ? `₹${(amount / 10000000).toFixed(2)} Cr`
        : `₹${(amount / 100000).toFixed(2)} Lakh`;

    return {
      success: true,
      message: `Common minimum base price set to ${formatted}${applyToAll ? ` (${result.count} players updated)` : ''}.`,
      minBasePrice: result.minBasePrice,
      affectedCount: result.count,
    };
  }

  // Action 11: Set maximum purse balance per team
  public setMaxPursePerTeam(
    amount: number,
    applyToAll: boolean = true
  ): { success: boolean; message: string; maxPursePerTeam: number; affectedCount: number } {
    if (!amount || amount <= 0) {
      return { success: false, message: 'Invalid maximum purse balance provided.', maxPursePerTeam: 0, affectedCount: 0 };
    }
    const result = this.db.setMaxPursePerTeam(amount, applyToAll);
    this.notifyStateChange();

    const formatted =
      amount >= 10000000
        ? `₹${(amount / 10000000).toFixed(2)} Cr`
        : `₹${(amount / 100000).toFixed(2)} Lakh`;

    return {
      success: true,
      message: `Maximum purse balance per team set to ${formatted}${applyToAll ? ` (${result.count} teams updated)` : ''}.`,
      maxPursePerTeam: result.maxPursePerTeam,
      affectedCount: result.count,
    };
  }

  // Action 12: Set total players / squad slots per team
  public setTotalPlayersPerTeam(
    slots: number,
    applyToAll: boolean = true
  ): { success: boolean; message: string; totalPlayersPerTeam: number; affectedCount: number } {
    if (!slots || slots < 1) {
      return { success: false, message: 'Invalid total players count provided.', totalPlayersPerTeam: 0, affectedCount: 0 };
    }
    const result = this.db.setTotalPlayersPerTeam(slots, applyToAll);
    this.notifyStateChange();

    return {
      success: true,
      message: `Total players per team set to ${slots} players${applyToAll ? ` (${result.count} teams updated)` : ''}.`,
      totalPlayersPerTeam: result.totalPlayersPerTeam,
      affectedCount: result.count,
    };
  }

  // Internal Countdown Timer (Disabled per user requirement)
  private startTimerTicker(): void {
    // Timer feature disabled: auction is manually controlled by the auctioneer
    this.stopTimer();
  }

  private handleTimerExpiry(): void {
    // Timer feature disabled
    this.stopTimer();
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}
