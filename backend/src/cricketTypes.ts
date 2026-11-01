export type TournamentFormat = 'LEAGUE' | 'LEAGUE_KNOCKOUT' | 'KNOCKOUT';
export type BallType = 'LEATHER' | 'TENNIS_TAPE' | 'TENNIS_HARD';
export type MatchStatus = 'UPCOMING' | 'TOSS_DONE' | 'LIVE' | 'INNINGS_BREAK' | 'COMPLETED' | 'ABANDONED' | 'TIED';
export type TossDecision = 'BAT' | 'BOWL';
export type WicketType =
  | 'BOWLED'
  | 'CAUGHT'
  | 'LBW'
  | 'RUN_OUT'
  | 'STUMPED'
  | 'HIT_WICKET'
  | 'RETIRED_HURT'
  | 'RETIRED_OUT'
  | 'OBSTRUCTING_FIELD';

export type ExtraType = 'NONE' | 'WIDE' | 'NO_BALL' | 'BYE' | 'LEG_BYE' | 'PENALTY';
export type CricketPlayerRole = 'Batter' | 'Bowler' | 'All-Rounder' | 'Wicketkeeper';

export interface TournamentPlayer {
  id: string;
  name: string;
  role: CricketPlayerRole;
  battingStyle?: string;
  bowlingStyle?: string;
  avatarUrl?: string;
  isWicketkeeper?: boolean;
  isCaptain?: boolean;
}

export interface TournamentTeam {
  id: string;
  name: string;
  shortCode: string;
  color: string;
  logoUrl?: string;
  players: TournamentPlayer[];
}

export interface WicketDetails {
  type: WicketType;
  dismissedPlayerId: string;
  dismissedPlayerName?: string;
  fielderId?: string;
  fielderName?: string;
  runOutEnd?: 'STRIKER' | 'NON_STRIKER';
}

export interface BallEvent {
  id: string;
  matchId: string;
  inningsNumber: number;
  ballIndex: number;
  overNumber: number; // 0-based over index
  deliveryInOver: number; // 1-based display delivery inside over
  displayOver: string; // e.g. "0.1", "14.4"
  bowlerId: string;
  bowlerName: string;
  strikerId: string;
  strikerName: string;
  nonStrikerId: string;
  nonStrikerName: string;
  runsOffBat: number;
  extraType: ExtraType;
  extraRuns: number;
  totalRunsOnDelivery: number;
  isLegalDelivery: boolean;
  isFreeHit: boolean;
  wicket?: WicketDetails;
  commentary: string;
  timestamp: number;
}

export interface BatterScore {
  playerId: string;
  name: string;
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  isOut: boolean;
  isOnStrike: boolean;
  isBatting: boolean;
  battingOrder?: number;
  dismissalText: string;
}

export interface BowlerSpell {
  playerId: string;
  name: string;
  legalDeliveries: number;
  oversDisplay: string;
  maidens: number;
  runsConceded: number;
  wickets: number;
  economy: number;
  dots: number;
  wides: number;
  noBalls: number;
  isCurrentBowler: boolean;
}

export interface FallOfWicket {
  wicketNumber: number;
  score: number;
  overs: string;
  dismissedPlayerId: string;
  dismissedPlayerName: string;
}

export interface Partnership {
  batter1Id: string;
  batter1Name: string;
  batter2Id: string;
  batter2Name: string;
  runs: number;
  balls: number;
}

export interface InningsState {
  inningsNumber: number;
  battingTeamId: string;
  bowlingTeamId: string;
  totalRuns: number;
  wickets: number;
  legalDeliveries: number;
  oversCompleted: number;
  ballsInCurrentOver: number;
  oversDisplay: string;
  currentRunRate: number;
  requiredRunRate?: number;
  target?: number;
  currentStrikerId: string | null;
  currentNonStrikerId: string | null;
  currentBowlerId: string | null;
  isFreeHit: boolean;
  isCompleted: boolean;
  allOut: boolean;
  extras: {
    wides: number;
    noBalls: number;
    byes: number;
    legByes: number;
    penalty: number;
    total: number;
  };
  recentBalls: BallEvent[];
  batters: { [playerId: string]: BatterScore };
  bowlers: { [playerId: string]: BowlerSpell };
  fallOfWickets: FallOfWicket[];
  currentPartnership: Partnership | null;
}

export interface MatchRules {
  totalOvers: number;
  maxOversPerBowler: number;
  wideValue: number;
  noBallValue: number;
  freeHitOnNoBall: boolean;
}

export interface TossInfo {
  winnerTeamId: string;
  decision: TossDecision;
}

export interface MatchResult {
  winnerTeamId?: string;
  isTie?: boolean;
  isNoResult?: boolean;
  margin?: string;
  manOfTheMatchId?: string;
}

export interface MatchFixture {
  id: string;
  tournamentId: string;
  matchNumber: number;
  title: string;
  teamAId: string;
  teamBId: string;
  venue: string;
  dateTime: string;
  rules: MatchRules;
  status: MatchStatus;
  toss?: TossInfo;
  firstInnings?: InningsState;
  secondInnings?: InningsState;
  currentInningsNumber: number;
  ballEvents: BallEvent[];
  result?: MatchResult;
  dlsRevised?: {
    overs: number;
    target: number;
  };
  scorerPin?: string;
}

export interface PointsTableEntry {
  teamId: string;
  teamName: string;
  shortCode: string;
  color: string;
  played: number;
  won: number;
  lost: number;
  tied: number;
  noResult: number;
  points: number;
  runsScored: number;
  legalOversFaced: number; // in decimal deliveries
  runsConceded: number;
  legalOversBowled: number;
  netRunRate: number;
}

export interface Tournament {
  id: string;
  name: string;
  season: string;
  format: TournamentFormat;
  totalOvers: number;
  maxOversPerBowler: number;
  ballType: BallType;
  teams: TournamentTeam[];
  fixtures: MatchFixture[];
  createdAt: number;
}
