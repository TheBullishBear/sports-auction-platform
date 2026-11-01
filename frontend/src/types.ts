export type PlayerRole = 'Batter' | 'Bowler' | 'All-Rounder' | 'Wicketkeeper';

export type PlayerStatus = 'UPCOMING' | 'ON_BLOCK' | 'SOLD' | 'UNSOLD';

export type AuctionStatus =
  | 'IDLE'
  | 'BID_PENDING'
  | 'BIDDING_ACTIVE'
  | 'HAMMER_GOING_1'
  | 'HAMMER_GOING_2'
  | 'HAMMER_FINAL_CALL'
  | 'SOLD'
  | 'UNSOLD'
  | 'PAUSED';

export interface PlayerStats {
  matches: number;
  runs?: number;
  strikeRate?: number;
  wickets?: number;
  economy?: number;
  battingStyle?: string;
  bowlingStyle?: string;
  highlights: string;
}

export interface Player {
  id: string;
  name: string;
  age?: number;
  contactNumber?: string;
  email?: string;
  city?: string;
  country: string;
  role: PlayerRole;
  isOverseas: boolean;
  basePrice: number;
  currentBid: number;
  currentHighBidderId: string | null;
  status: PlayerStatus;
  soldPrice: number | null;
  winningTeamId: string | null;
  avatarUrl: string;
  orderIndex: number;
  stats: PlayerStats;
}

export interface Team {
  id: string;
  name: string;
  code: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  totalPurse: number;
  remainingPurse: number;
  maxSlots: number;
  minSlots: number;
  currentSlots: number;
  maxOverseas: number;
  currentOverseas: number;
  playersAcquired: string[];
}

export interface BidLedgerEntry {
  id: string;
  auctionId: string;
  playerId: string;
  teamId: string;
  teamName: string;
  teamCode: string;
  teamColor: string;
  bidAmount: number;
  bidSequence: number;
  timestamp: number;
  serverLatencyMs?: number;
}

export interface AuctionSession {
  id: string;
  status: AuctionStatus;
  currentPlayerId: string | null;
  timerSeconds: number;
  isPaused: boolean;
  hammerPhase: number;
  lastBidTimestamp: number | null;
  lastHighBid: BidLedgerEntry | null;
  minBasePrice: number; // Common tournament minimum base price for players
  maxPursePerTeam: number; // Maximum purse balance per team
  totalPlayersPerTeam: number; // Total players / squad slots per team
}

export interface LiveStateSnapshot {
  session: AuctionSession;
  currentPlayer: Player | null;
  currentHighBid: BidLedgerEntry | null;
  nextMinimumBid: number;
  nextIncrement: number;
  bidHistory: BidLedgerEntry[];
  teams: Team[];
  playersQueue: Player[];
  recentSales: {
    player: Player;
    team: Team;
    price: number;
    timestamp: number;
  }[];
}
