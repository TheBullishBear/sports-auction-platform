import fs from 'fs';
import path from 'path';
import {
  Tournament,
  TournamentTeam,
  TournamentPlayer,
  MatchFixture,
  BallEvent,
  MatchStatus,
  TossDecision,
  PointsTableEntry,
  MatchRules,
} from './cricketTypes';
import { CricketScoringEngine } from './cricketScoringEngine';

export class CricketDatabaseManager {
  private static instance: CricketDatabaseManager;
  private tournaments: Map<string, Tournament> = new Map();
  private matches: Map<string, MatchFixture> = new Map();
  private dataDir: string;
  private tournamentsFilePath: string;
  private matchesFilePath: string;

  private constructor() {
    this.dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    this.tournamentsFilePath = path.join(this.dataDir, 'tournaments_database.json');
    this.matchesFilePath = path.join(this.dataDir, 'matches_database.json');

    this.loadFromDisk();
    if (this.tournaments.size === 0) {
      this.seedDemoData();
    }
  }

  public static getInstance(): CricketDatabaseManager {
    if (!CricketDatabaseManager.instance) {
      CricketDatabaseManager.instance = new CricketDatabaseManager();
    }
    return CricketDatabaseManager.instance;
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.tournamentsFilePath)) {
        const raw = fs.readFileSync(this.tournamentsFilePath, 'utf-8');
        const list: Tournament[] = JSON.parse(raw);
        list.forEach((t) => this.tournaments.set(t.id, t));
      }
      if (fs.existsSync(this.matchesFilePath)) {
        const raw = fs.readFileSync(this.matchesFilePath, 'utf-8');
        const list: MatchFixture[] = JSON.parse(raw);
        list.forEach((m) => this.matches.set(m.id, m));
      }
    } catch (e) {
      console.error('Error reading cricket tournament data from disk:', e);
    }
  }

  private saveToDisk() {
    try {
      fs.writeFileSync(
        this.tournamentsFilePath,
        JSON.stringify(Array.from(this.tournaments.values()), null, 2),
        'utf-8'
      );
      fs.writeFileSync(
        this.matchesFilePath,
        JSON.stringify(Array.from(this.matches.values()), null, 2),
        'utf-8'
      );
    } catch (e) {
      console.error('Error saving cricket data to disk:', e);
    }
  }

  private seedDemoData() {
    const team1: TournamentTeam = {
      id: 'team-mb',
      name: 'Mumbai Blasters',
      shortCode: 'MB',
      color: '#0284c7', // Sky Blue
      players: [
        { id: 'mb-1', name: 'Rohit Sharma (c)', role: 'Batter', isCaptain: true },
        { id: 'mb-2', name: 'Ishan Kishan (wk)', role: 'Wicketkeeper', isWicketkeeper: true },
        { id: 'mb-3', name: 'Suryakumar Yadav', role: 'Batter' },
        { id: 'mb-4', name: 'Hardik Pandya', role: 'All-Rounder' },
        { id: 'mb-5', name: 'Tilak Varma', role: 'Batter' },
        { id: 'mb-6', name: 'Tim David', role: 'All-Rounder' },
        { id: 'mb-7', name: 'Jasprit Bumrah', role: 'Bowler' },
        { id: 'mb-8', name: 'Piyush Chawla', role: 'Bowler' },
      ],
    };

    const team2: TournamentTeam = {
      id: 'team-tsk',
      name: 'Thane Super Kings',
      shortCode: 'TSK',
      color: '#eab308', // Yellow
      players: [
        { id: 'tsk-1', name: 'Ruturaj Gaikwad (c)', role: 'Batter', isCaptain: true },
        { id: 'tsk-2', name: 'Devon Conway', role: 'Batter' },
        { id: 'tsk-3', name: 'Shivam Dube', role: 'All-Rounder' },
        { id: 'tsk-4', name: 'Ravindra Jadeja', role: 'All-Rounder' },
        { id: 'tsk-5', name: 'MS Dhoni (wk)', role: 'Wicketkeeper', isWicketkeeper: true },
        { id: 'tsk-6', name: 'Deepak Chahar', role: 'Bowler' },
        { id: 'tsk-7', name: 'Matheesha Pathirana', role: 'Bowler' },
        { id: 'tsk-8', name: 'Maheesh Theekshana', role: 'Bowler' },
      ],
    };

    const team3: TournamentTeam = {
      id: 'team-nms',
      name: 'Navi Mumbai Strikers',
      shortCode: 'NMS',
      color: '#10b981', // Emerald
      players: [
        { id: 'nms-1', name: 'Shubman Gill (c)', role: 'Batter', isCaptain: true },
        { id: 'nms-2', name: 'Wriddhiman Saha (wk)', role: 'Wicketkeeper', isWicketkeeper: true },
        { id: 'nms-3', name: 'Sai Sudharsan', role: 'Batter' },
        { id: 'nms-4', name: 'David Miller', role: 'Batter' },
        { id: 'nms-5', name: 'Rashid Khan', role: 'All-Rounder' },
        { id: 'nms-6', name: 'Rahul Tewatia', role: 'All-Rounder' },
        { id: 'nms-7', name: 'Mohammed Shami', role: 'Bowler' },
        { id: 'nms-8', name: 'Mohit Sharma', role: 'Bowler' },
      ],
    };

    const tournamentId = 'tourn-mpl-2026';
    const matchRules: MatchRules = {
      totalOvers: 5, // 5-over dynamic blitz match
      maxOversPerBowler: 2,
      wideValue: 1,
      noBallValue: 1,
      freeHitOnNoBall: true,
    };

    const match1Id = 'match-101';
    const sampleBallEvents: BallEvent[] = [
      {
        id: 'ball-1',
        matchId: match1Id,
        inningsNumber: 1,
        ballIndex: 0,
        overNumber: 0,
        deliveryInOver: 1,
        displayOver: '0.1',
        bowlerId: 'tsk-6',
        bowlerName: 'Deepak Chahar',
        strikerId: 'mb-1',
        strikerName: 'Rohit Sharma (c)',
        nonStrikerId: 'mb-2',
        nonStrikerName: 'Ishan Kishan (wk)',
        runsOffBat: 4,
        extraType: 'NONE',
        extraRuns: 0,
        totalRunsOnDelivery: 4,
        isLegalDelivery: true,
        isFreeHit: false,
        commentary: 'FOUR! Smashed off the back foot through point to open the account in style!',
        timestamp: Date.now() - 120000,
      },
      {
        id: 'ball-2',
        matchId: match1Id,
        inningsNumber: 1,
        ballIndex: 1,
        overNumber: 0,
        deliveryInOver: 2,
        displayOver: '0.2',
        bowlerId: 'tsk-6',
        bowlerName: 'Deepak Chahar',
        strikerId: 'mb-1',
        strikerName: 'Rohit Sharma (c)',
        nonStrikerId: 'mb-2',
        nonStrikerName: 'Ishan Kishan (wk)',
        runsOffBat: 1,
        extraType: 'NONE',
        extraRuns: 0,
        totalRunsOnDelivery: 1,
        isLegalDelivery: true,
        isFreeHit: false,
        commentary: 'Worked towards square leg, taking a quick single to rotate the strike.',
        timestamp: Date.now() - 90000,
      },
      {
        id: 'ball-3',
        matchId: match1Id,
        inningsNumber: 1,
        ballIndex: 2,
        overNumber: 0,
        deliveryInOver: 3,
        displayOver: '0.3',
        bowlerId: 'tsk-6',
        bowlerName: 'Deepak Chahar',
        strikerId: 'mb-2',
        strikerName: 'Ishan Kishan (wk)',
        nonStrikerId: 'mb-1',
        nonStrikerName: 'Rohit Sharma (c)',
        runsOffBat: 6,
        extraType: 'NONE',
        extraRuns: 0,
        totalRunsOnDelivery: 6,
        isLegalDelivery: true,
        isFreeHit: false,
        commentary: 'SIX! Picked up cleanly off the pads and dispatched deep into the mid-wicket stands!',
        timestamp: Date.now() - 60000,
      },
      {
        id: 'ball-4',
        matchId: match1Id,
        inningsNumber: 1,
        ballIndex: 3,
        overNumber: 0,
        deliveryInOver: 4,
        displayOver: '0.4',
        bowlerId: 'tsk-6',
        bowlerName: 'Deepak Chahar',
        strikerId: 'mb-2',
        strikerName: 'Ishan Kishan (wk)',
        nonStrikerId: 'mb-1',
        nonStrikerName: 'Rohit Sharma (c)',
        runsOffBat: 0,
        extraType: 'WIDE',
        extraRuns: 1,
        totalRunsOnDelivery: 1,
        isLegalDelivery: false,
        isFreeHit: false,
        commentary: 'Deepak Chahar strays down the leg side, signaled WIDE.',
        timestamp: Date.now() - 30000,
      },
    ];

    const firstInnings = CricketScoringEngine.calculateInningsState(
      sampleBallEvents,
      team1,
      team2,
      matchRules,
      undefined,
      'mb-1',
      'mb-2',
      'tsk-6'
    );

    const match1: MatchFixture = {
      id: match1Id,
      tournamentId,
      matchNumber: 1,
      title: 'Match 1 - Mumbai Blasters vs Thane Super Kings',
      teamAId: team1.id,
      teamBId: team2.id,
      venue: 'Wankhede Community Stadium, Mumbai',
      dateTime: 'Today, 07:00 PM IST',
      rules: matchRules,
      status: 'LIVE',
      toss: {
        winnerTeamId: team2.id,
        decision: 'BOWL',
      },
      firstInnings,
      currentInningsNumber: 1,
      ballEvents: sampleBallEvents,
      scorerPin: '1234',
    };

    const match2: MatchFixture = {
      id: 'match-102',
      tournamentId,
      matchNumber: 2,
      title: 'Match 2 - Thane Super Kings vs Navi Mumbai Strikers',
      teamAId: team2.id,
      teamBId: team3.id,
      venue: 'DY Patil Sports Arena, Navi Mumbai',
      dateTime: 'Tomorrow, 04:00 PM IST',
      rules: matchRules,
      status: 'UPCOMING',
      currentInningsNumber: 1,
      ballEvents: [],
      scorerPin: '1234',
    };

    const match3: MatchFixture = {
      id: 'match-103',
      tournamentId,
      matchNumber: 3,
      title: 'Match 3 - Mumbai Blasters vs Navi Mumbai Strikers',
      teamAId: team1.id,
      teamBId: team3.id,
      venue: 'Gymkhana Ground, Thane',
      dateTime: 'Sunday, 07:00 PM IST',
      rules: matchRules,
      status: 'UPCOMING',
      currentInningsNumber: 1,
      ballEvents: [],
      scorerPin: '1234',
    };

    const tournament: Tournament = {
      id: tournamentId,
      name: 'Premier Box Cricket Championship 2026',
      season: 'Season 1',
      format: 'LEAGUE',
      totalOvers: 5,
      maxOversPerBowler: 2,
      ballType: 'TENNIS_HARD',
      teams: [team1, team2, team3],
      fixtures: [match1, match2, match3],
      createdAt: Date.now(),
    };

    this.tournaments.set(tournament.id, tournament);
    this.matches.set(match1.id, match1);
    this.matches.set(match2.id, match2);
    this.matches.set(match3.id, match3);
    this.saveToDisk();
  }

  public getAllTournaments(): Tournament[] {
    return Array.from(this.tournaments.values());
  }

  public getTournament(id: string): Tournament | undefined {
    return this.tournaments.get(id);
  }

  public createTournament(t: Tournament): Tournament {
    this.tournaments.set(t.id, t);
    t.fixtures.forEach((f) => this.matches.set(f.id, f));
    this.saveToDisk();
    return t;
  }

  public getMatch(id: string): MatchFixture | undefined {
    return this.matches.get(id);
  }

  public updateToss(matchId: string, winnerTeamId: string, decision: TossDecision): MatchFixture | null {
    const match = this.matches.get(matchId);
    if (!match) return null;

    match.toss = { winnerTeamId, decision };
    match.status = 'TOSS_DONE';

    const tourn = this.tournaments.get(match.tournamentId);
    const teamA = tourn?.teams.find((t) => t.id === match.teamAId);
    const teamB = tourn?.teams.find((t) => t.id === match.teamBId);

    // Determine who bats first
    let battingTeamId = match.teamAId;
    let bowlingTeamId = match.teamBId;

    if (winnerTeamId === match.teamAId) {
      if (decision === 'BOWL') {
        battingTeamId = match.teamBId;
        bowlingTeamId = match.teamAId;
      }
    } else {
      if (decision === 'BAT') {
        battingTeamId = match.teamBId;
        bowlingTeamId = match.teamAId;
      }
    }

    const battingTeam = teamA?.id === battingTeamId ? teamA : teamB;
    const bowlingTeam = teamA?.id === bowlingTeamId ? teamA : teamB;

    if (battingTeam && bowlingTeam) {
      match.firstInnings = CricketScoringEngine.calculateInningsState(
        [],
        battingTeam,
        bowlingTeam,
        match.rules
      );
      match.currentInningsNumber = 1;
      match.status = 'LIVE';
    }

    this.saveToDisk();
    return match;
  }

  public startInnings(
    matchId: string,
    inningsNumber: number,
    strikerId: string,
    nonStrikerId: string,
    bowlerId: string
  ): MatchFixture | null {
    const match = this.matches.get(matchId);
    if (!match) return null;

    const tourn = this.tournaments.get(match.tournamentId);
    if (!tourn) return null;

    const teamA = tourn.teams.find((t) => t.id === match.teamAId);
    const teamB = tourn.teams.find((t) => t.id === match.teamBId);
    if (!teamA || !teamB) return null;

    const inn1 = match.firstInnings;
    let battingTeam = inn1 ? (inn1.battingTeamId === teamA.id ? teamB : teamA) : teamA;
    let bowlingTeam = inn1 ? (inn1.bowlingTeamId === teamA.id ? teamB : teamA) : teamB;

    if (inningsNumber === 1) {
      battingTeam = inn1 ? (inn1.battingTeamId === teamA.id ? teamA : teamB) : teamA;
      bowlingTeam = inn1 ? (inn1.bowlingTeamId === teamA.id ? teamA : teamB) : teamB;
    }

    const target = inningsNumber === 2 && match.firstInnings ? match.firstInnings.totalRuns + 1 : undefined;

    const inningsState = CricketScoringEngine.calculateInningsState(
      [],
      battingTeam,
      bowlingTeam,
      match.rules,
      target,
      strikerId,
      nonStrikerId,
      bowlerId
    );

    if (inningsNumber === 1) {
      match.firstInnings = inningsState;
    } else {
      match.secondInnings = inningsState;
    }

    match.currentInningsNumber = inningsNumber;
    match.status = 'LIVE';
    this.saveToDisk();
    return match;
  }

  public recordBall(matchId: string, ball: BallEvent): { match: MatchFixture; newBall: BallEvent } | null {
    const match = this.matches.get(matchId);
    if (!match) return null;

    const tourn = this.tournaments.get(match.tournamentId);
    if (!tourn) return null;

    const teamA = tourn.teams.find((t) => t.id === match.teamAId);
    const teamB = tourn.teams.find((t) => t.id === match.teamBId);
    if (!teamA || !teamB) return null;

    const activeInningsNumber = match.currentInningsNumber;
    const isFirstInnings = activeInningsNumber === 1;

    let battingTeam = teamA;
    let bowlingTeam = teamB;

    if (isFirstInnings) {
      if (match.firstInnings) {
        battingTeam = match.firstInnings.battingTeamId === teamA.id ? teamA : teamB;
        bowlingTeam = match.firstInnings.bowlingTeamId === teamA.id ? teamA : teamB;
      }
    } else {
      if (match.secondInnings) {
        battingTeam = match.secondInnings.battingTeamId === teamA.id ? teamA : teamB;
        bowlingTeam = match.secondInnings.bowlingTeamId === teamA.id ? teamA : teamB;
      }
    }

    // Append ball to ledger
    ball.ballIndex = match.ballEvents.length;
    match.ballEvents.push(ball);

    // Filter balls for this innings
    const inningsBalls = match.ballEvents.filter((b) => b.inningsNumber === activeInningsNumber);
    const target = !isFirstInnings && match.firstInnings ? match.firstInnings.totalRuns + 1 : undefined;

    const updatedInnings = CricketScoringEngine.calculateInningsState(
      inningsBalls,
      battingTeam,
      bowlingTeam,
      match.rules,
      target
    );

    if (isFirstInnings) {
      match.firstInnings = updatedInnings;
      if (updatedInnings.isCompleted) {
        match.status = 'INNINGS_BREAK';
      }
    } else {
      match.secondInnings = updatedInnings;
      if (updatedInnings.isCompleted) {
        match.status = 'COMPLETED';
        // Compute Winner
        const inn1Runs = match.firstInnings?.totalRuns || 0;
        const inn2Runs = updatedInnings.totalRuns;
        const team1 = battingTeam.id === teamA.id ? teamB : teamA;
        const team2 = battingTeam;

        if (inn2Runs > inn1Runs) {
          const wktsRemaining = Math.max(0, battingTeam.players.length - 1 - updatedInnings.wickets);
          match.result = {
            winnerTeamId: team2.id,
            margin: `${team2.name} won by ${wktsRemaining} wickets`,
          };
        } else if (inn1Runs > inn2Runs) {
          const runMargin = inn1Runs - inn2Runs;
          match.result = {
            winnerTeamId: team1.id,
            margin: `${team1.name} won by ${runMargin} runs`,
          };
        } else {
          match.result = {
            isTie: true,
            margin: 'Match Tied! (Super Over required)',
          };
        }
      }
    }

    this.saveToDisk();
    return { match, newBall: ball };
  }

  public undoLastBall(matchId: string): MatchFixture | null {
    const match = this.matches.get(matchId);
    if (!match || match.ballEvents.length === 0) return null;

    const popped = match.ballEvents.pop();
    if (!popped) return match;

    const tourn = this.tournaments.get(match.tournamentId);
    if (!tourn) return null;

    const teamA = tourn.teams.find((t) => t.id === match.teamAId);
    const teamB = tourn.teams.find((t) => t.id === match.teamBId);
    if (!teamA || !teamB) return null;

    // Recalculate first innings
    const inn1Balls = match.ballEvents.filter((b) => b.inningsNumber === 1);
    if (match.firstInnings) {
      const bat1 = match.firstInnings.battingTeamId === teamA.id ? teamA : teamB;
      const bowl1 = match.firstInnings.bowlingTeamId === teamA.id ? teamA : teamB;
      match.firstInnings = CricketScoringEngine.calculateInningsState(inn1Balls, bat1, bowl1, match.rules);
    }

    // Recalculate second innings if active
    const inn2Balls = match.ballEvents.filter((b) => b.inningsNumber === 2);
    if (match.secondInnings) {
      const bat2 = match.secondInnings.battingTeamId === teamA.id ? teamA : teamB;
      const bowl2 = match.secondInnings.bowlingTeamId === teamA.id ? teamA : teamB;
      const target = match.firstInnings ? match.firstInnings.totalRuns + 1 : undefined;
      match.secondInnings = CricketScoringEngine.calculateInningsState(inn2Balls, bat2, bowl2, match.rules, target);
    }

    if (match.status === 'COMPLETED' && (!match.secondInnings || !match.secondInnings.isCompleted)) {
      match.status = 'LIVE';
      match.result = undefined;
    } else if (match.status === 'INNINGS_BREAK' && (!match.firstInnings || !match.firstInnings.isCompleted)) {
      match.status = 'LIVE';
    }

    this.saveToDisk();
    return match;
  }

  public editBall(matchId: string, ballId: string, updatedBall: Partial<BallEvent>): MatchFixture | null {
    const match = this.matches.get(matchId);
    if (!match) return null;

    const idx = match.ballEvents.findIndex((b) => b.id === ballId);
    if (idx === -1) return null;

    match.ballEvents[idx] = { ...match.ballEvents[idx], ...updatedBall };

    // Replay entire state
    const tourn = this.tournaments.get(match.tournamentId);
    if (!tourn) return null;

    const teamA = tourn.teams.find((t) => t.id === match.teamAId);
    const teamB = tourn.teams.find((t) => t.id === match.teamBId);
    if (!teamA || !teamB) return null;

    const inn1Balls = match.ballEvents.filter((b) => b.inningsNumber === 1);
    if (match.firstInnings) {
      const bat1 = match.firstInnings.battingTeamId === teamA.id ? teamA : teamB;
      const bowl1 = match.firstInnings.bowlingTeamId === teamA.id ? teamA : teamB;
      match.firstInnings = CricketScoringEngine.calculateInningsState(inn1Balls, bat1, bowl1, match.rules);
    }

    const inn2Balls = match.ballEvents.filter((b) => b.inningsNumber === 2);
    if (match.secondInnings) {
      const bat2 = match.secondInnings.battingTeamId === teamA.id ? teamA : teamB;
      const bowl2 = match.secondInnings.bowlingTeamId === teamA.id ? teamA : teamB;
      const target = match.firstInnings ? match.firstInnings.totalRuns + 1 : undefined;
      match.secondInnings = CricketScoringEngine.calculateInningsState(inn2Balls, bat2, bowl2, match.rules, target);
    }

    this.saveToDisk();
    return match;
  }

  public getTournamentStandings(tournamentId: string): {
    pointsTable: PointsTableEntry[];
    topBatters: { id: string; name: string; teamCode: string; runs: number; strikeRate: number; sixes: number }[];
    topBowlers: { id: string; name: string; teamCode: string; wickets: number; economy: number }[];
  } {
    const tourn = this.tournaments.get(tournamentId);
    if (!tourn) {
      return { pointsTable: [], topBatters: [], topBowlers: [] };
    }

    const pointsTable = CricketScoringEngine.calculatePointsTable(tourn.teams, tourn.fixtures);

    // Aggregate player stats across all tournament matches
    const batterStats: { [id: string]: { name: string; teamCode: string; runs: number; balls: number; sixes: number } } = {};
    const bowlerStats: { [id: string]: { name: string; teamCode: string; wickets: number; runs: number; legalBalls: number } } = {};

    tourn.fixtures.forEach((match) => {
      [match.firstInnings, match.secondInnings].forEach((inn) => {
        if (!inn) return;
        const team = tourn.teams.find((t) => t.id === inn.battingTeamId);
        const bowlingT = tourn.teams.find((t) => t.id === inn.bowlingTeamId);

        Object.values(inn.batters).forEach((b) => {
          if (!batterStats[b.playerId]) {
            batterStats[b.playerId] = {
              name: b.name,
              teamCode: team?.shortCode || '',
              runs: 0,
              balls: 0,
              sixes: 0,
            };
          }
          batterStats[b.playerId].runs += b.runs;
          batterStats[b.playerId].balls += b.ballsFaced;
          batterStats[b.playerId].sixes += b.sixes;
        });

        Object.values(inn.bowlers).forEach((bw) => {
          if (!bowlerStats[bw.playerId]) {
            bowlerStats[bw.playerId] = {
              name: bw.name,
              teamCode: bowlingT?.shortCode || '',
              wickets: 0,
              runs: 0,
              legalBalls: 0,
            };
          }
          bowlerStats[bw.playerId].wickets += bw.wickets;
          bowlerStats[bw.playerId].runs += bw.runsConceded;
          bowlerStats[bw.playerId].legalBalls += bw.legalDeliveries;
        });
      });
    });

    const topBatters = Object.entries(batterStats)
      .map(([id, s]) => ({
        id,
        name: s.name,
        teamCode: s.teamCode,
        runs: s.runs,
        strikeRate: s.balls > 0 ? Number(((s.runs / s.balls) * 100).toFixed(1)) : 0,
        sixes: s.sixes,
      }))
      .sort((a, b) => b.runs - a.runs)
      .slice(0, 5);

    const topBowlers = Object.entries(bowlerStats)
      .map(([id, s]) => ({
        id,
        name: s.name,
        teamCode: s.teamCode,
        wickets: s.wickets,
        economy: s.legalBalls > 0 ? Number(((s.runs / s.legalBalls) * 6).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.wickets - a.wickets)
      .slice(0, 5);

    return { pointsTable, topBatters, topBowlers };
  }
}
