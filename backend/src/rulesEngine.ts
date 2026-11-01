import { Player, Team, AuctionSession, ValidationResult } from './types';

export class BidRulesEngine {
  // IPL-style dynamic increment slabs based on current bid level
  public static calculateIncrement(currentBid: number, basePrice: number): number {
    if (currentBid === 0) {
      return basePrice; // Opening bid is the base price
    }
    if (currentBid < 10000000) {
      // Under 1 Cr: +10 Lakhs
      return 1000000;
    } else if (currentBid < 50000000) {
      // 1 Cr to 5 Cr: +25 Lakhs
      return 2500000;
    } else if (currentBid < 100000000) {
      // 5 Cr to 10 Cr: +50 Lakhs
      return 5000000;
    } else {
      // 10 Cr and above: +1 Crore
      return 10000000;
    }
  }

  public static calculateNextMinimumBid(player: Player): number {
    if (player.currentBid === 0) {
      return player.basePrice;
    }
    const increment = this.calculateIncrement(player.currentBid, player.basePrice);
    return player.currentBid + increment;
  }

  // Helper to format currency in INR Crores or Lakhs
  public static formatINR(amount: number): string {
    if (amount >= 10000000) {
      const cr = amount / 10000000;
      return cr % 1 === 0 ? `₹${cr} Cr` : `₹${cr.toFixed(2)} Cr`;
    } else if (amount >= 100000) {
      const lakh = amount / 100000;
      return lakh % 1 === 0 ? `₹${lakh} Lakh` : `₹${lakh.toFixed(2)} Lakh`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  }

  // Calculate required reserve and maximum allowable bid for a franchise
  public static calculatePurseReserve(
    team: Team,
    session: AuctionSession
  ): {
    targetSlots: number;
    remainingSlotsNeeded: number;
    basePriceReserve: number;
    requiredReserve: number;
    maxAffordableBid: number;
  } {
    const targetSlots = session.totalPlayersPerTeam || team.maxSlots || team.minSlots || 11;
    // Slots remaining to be acquired after winning the current player lot
    const remainingSlotsNeeded = Math.max(0, targetSlots - team.currentSlots - 1);
    const basePriceReserve = session.minBasePrice || 20000000;
    const requiredReserve = remainingSlotsNeeded * basePriceReserve;
    const maxAffordableBid = Math.max(0, team.remainingPurse - requiredReserve);

    return {
      targetSlots,
      remainingSlotsNeeded,
      basePriceReserve,
      requiredReserve,
      maxAffordableBid,
    };
  }

  public static validateBid(
    player: Player,
    team: Team,
    session: AuctionSession,
    bidAmount: number
  ): ValidationResult {
    // 1. Auction State Constraint
    if (
      session.status !== 'BIDDING_ACTIVE' &&
      session.status !== 'HAMMER_GOING_1' &&
      session.status !== 'HAMMER_GOING_2' &&
      session.status !== 'HAMMER_FINAL_CALL'
    ) {
      return {
        valid: false,
        errorCode: 'AUCTION_NOT_ACTIVE',
        reason: `Bidding is not currently active (Current State: ${session.status})`,
      };
    }

    if (session.currentPlayerId !== player.id || player.status !== 'ON_BLOCK') {
      return {
        valid: false,
        errorCode: 'PLAYER_NOT_ON_BLOCK',
        reason: `Player ${player.name} is not currently on the auction block`,
      };
    }

    // 2. Self-Bid Constraint
    if (player.currentHighBidderId === team.id) {
      return {
        valid: false,
        errorCode: 'ALREADY_HIGHEST_BIDDER',
        reason: `${team.name} already holds the highest active bid for ${player.name}`,
      };
    }

    // 3. Minimum Bid Amount & Increment Constraint
    const minRequiredBid = this.calculateNextMinimumBid(player);
    if (bidAmount < minRequiredBid) {
      return {
        valid: false,
        errorCode: 'INVALID_BID_AMOUNT',
        reason: `Bid amount ${this.formatINR(bidAmount)} is lower than minimum allowed bid ${this.formatINR(minRequiredBid)}`,
      };
    }

    // 4. Roster Slots Constraint
    if (team.currentSlots >= team.maxSlots) {
      return {
        valid: false,
        errorCode: 'ROSTER_LIMIT_REACHED',
        reason: `${team.name} has already reached the maximum roster limit (${team.maxSlots} players)`,
      };
    }

    // 5. Overseas Slots Constraint
    if (player.isOverseas && team.currentOverseas >= team.maxOverseas) {
      return {
        valid: false,
        errorCode: 'OVERSEAS_LIMIT_REACHED',
        reason: `${team.name} has exhausted its overseas quota (${team.maxOverseas} overseas players)`,
      };
    }

    // 6. Remaining Purse Constraint (Direct Overdraft Prevention)
    if (team.remainingPurse < bidAmount) {
      return {
        valid: false,
        errorCode: 'INSUFFICIENT_PURSE',
        reason: `${team.name} has insufficient purse balance (Balance: ${this.formatINR(team.remainingPurse)}, Attempted Bid: ${this.formatINR(bidAmount)})`,
      };
    }

    // 7. Purse Reserve Constraint (Must retain enough to fill remaining squad slots at minimum base price)
    const { targetSlots, remainingSlotsNeeded, basePriceReserve, requiredReserve, maxAffordableBid } =
      this.calculatePurseReserve(team, session);

    if (bidAmount > maxAffordableBid) {
      return {
        valid: false,
        errorCode: 'PURSE_RESERVE_VIOLATION',
        reason: `${team.name} cannot bid ${this.formatINR(bidAmount)}! With ${team.currentSlots} of ${targetSlots} players signed, you must reserve ${this.formatINR(requiredReserve)} to buy the next ${remainingSlotsNeeded} player(s) at base price (${this.formatINR(basePriceReserve)} each). Maximum allowable bid on this player is ${this.formatINR(maxAffordableBid)}.`,
        requiredPurseReserve: requiredReserve,
        maxAffordableBid: maxAffordableBid,
      };
    }

    return { valid: true };
  }
}
