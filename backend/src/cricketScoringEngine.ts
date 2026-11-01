import {
  BallEvent,
  BatterScore,
  BowlerSpell,
  FallOfWicket,
  InningsState,
  MatchRules,
  Partnership,
  TournamentTeam,
  TournamentPlayer,
  PointsTableEntry,
  MatchFixture,
} from './cricketTypes';

export class CricketScoringEngine {
  /**
   * Pure functional reducer: Reconstructs the complete InningsState deterministically
   * from an immutable array of BallEvents.
   */
  public static calculateInningsState(
    balls: BallEvent[],
    battingTeam: TournamentTeam,
    bowlingTeam: TournamentTeam,
    rules: MatchRules,
    target?: number,
    initialStrikerId?: string,
    initialNonStrikerId?: string,
    initialBowlerId?: string
  ): InningsState {
    const totalBattersCount = battingTeam.players.length;
    const maxWickets = Math.max(1, totalBattersCount - 1); // 10 wickets for 11 players

    let totalRuns = 0;
    let wickets = 0;
    let legalDeliveries = 0;
    let isFreeHit = false;

    const extras = {
      wides: 0,
      noBalls: 0,
      byes: 0,
      legByes: 0,
      penalty: 0,
      total: 0,
    };

    // Initialize Batters map
    const batters: { [playerId: string]: BatterScore } = {};
    battingTeam.players.forEach((p, idx) => {
      batters[p.id] = {
        playerId: p.id,
        name: p.name,
        runs: 0,
        ballsFaced: 0,
        fours: 0,
        sixes: 0,
        strikeRate: 0,
        isOut: false,
        isOnStrike: false,
        isBatting: false,
        battingOrder: idx + 1,
        dismissalText: 'not out',
      };
    });

    // Initialize Bowlers map
    const bowlers: { [playerId: string]: BowlerSpell } = {};
    bowlingTeam.players.forEach((p) => {
      bowlers[p.id] = {
        playerId: p.id,
        name: p.name,
        legalDeliveries: 0,
        oversDisplay: '0.0',
        maidens: 0,
        runsConceded: 0,
        wickets: 0,
        economy: 0,
        dots: 0,
        wides: 0,
        noBalls: 0,
        isCurrentBowler: false,
      };
    });

    let currentStrikerId = initialStrikerId || (battingTeam.players[0] ? battingTeam.players[0].id : null);
    let currentNonStrikerId = initialNonStrikerId || (battingTeam.players[1] ? battingTeam.players[1].id : null);
    let currentBowlerId = initialBowlerId || (bowlingTeam.players[0] ? bowlingTeam.players[0].id : null);

    if (currentStrikerId && batters[currentStrikerId]) {
      batters[currentStrikerId].isBatting = true;
      batters[currentStrikerId].isOnStrike = true;
    }
    if (currentNonStrikerId && batters[currentNonStrikerId]) {
      batters[currentNonStrikerId].isBatting = true;
      batters[currentNonStrikerId].isOnStrike = false;
    }

    const fallOfWickets: FallOfWicket[] = [];
    let currentPartnership: Partnership | null =
      currentStrikerId && currentNonStrikerId
        ? {
            batter1Id: currentStrikerId,
            batter1Name: batters[currentStrikerId]?.name || 'Striker',
            batter2Id: currentNonStrikerId,
            batter2Name: batters[currentNonStrikerId]?.name || 'Non-Striker',
            runs: 0,
            balls: 0,
          }
        : null;

    // Track per-over bowler runs to compute maidens
    const overBowlerStats: { [overIndex: number]: { bowlerId: string; legalBalls: number; bowlerRuns: number } } = {};

    // Replay every ball event in chronological sequence
    for (let i = 0; i < balls.length; i++) {
      const b = balls[i];
      const deliveryTotalRuns = b.runsOffBat + b.extraRuns;
      totalRuns += deliveryTotalRuns;

      // Update Extras tally
      if (b.extraType === 'WIDE') {
        extras.wides += b.extraRuns;
        extras.total += b.extraRuns;
      } else if (b.extraType === 'NO_BALL') {
        extras.noBalls += b.extraRuns;
        extras.total += b.extraRuns;
      } else if (b.extraType === 'BYE') {
        extras.byes += b.extraRuns;
        extras.total += b.extraRuns;
      } else if (b.extraType === 'LEG_BYE') {
        extras.legByes += b.extraRuns;
        extras.total += b.extraRuns;
      } else if (b.extraType === 'PENALTY') {
        extras.penalty += b.extraRuns;
        extras.total += b.extraRuns;
      }

      // Legal delivery counter
      if (b.isLegalDelivery) {
        legalDeliveries++;
      }

      // Track batter stats
      const striker = batters[b.strikerId];
      if (striker) {
        striker.isBatting = true;
        // Wides do NOT count as balls faced by batter
        if (b.extraType !== 'WIDE') {
          striker.ballsFaced++;
          if (b.runsOffBat === 0 && b.extraType === 'NONE') {
            // dot ball
          }
        }
        striker.runs += b.runsOffBat;
        if (b.runsOffBat === 4) striker.fours++;
        if (b.runsOffBat === 6) striker.sixes++;
        striker.strikeRate =
          striker.ballsFaced > 0 ? Number(((striker.runs / striker.ballsFaced) * 100).toFixed(1)) : 0;
      }

      // Track bowler stats
      const bowler = bowlers[b.bowlerId];
      if (bowler) {
        if (b.isLegalDelivery) {
          bowler.legalDeliveries++;
          const overPart = Math.floor(bowler.legalDeliveries / 6);
          const ballPart = bowler.legalDeliveries % 6;
          bowler.oversDisplay = `${overPart}.${ballPart}`;
        }
        if (b.extraType === 'WIDE') bowler.wides++;
        if (b.extraType === 'NO_BALL') bowler.noBalls++;

        // Runs charged to bowler: bat runs + wide + no ball (byes & legbyes are fielding errors, not bowler runs)
        const bowlerCharge =
          b.runsOffBat +
          (b.extraType === 'WIDE' || b.extraType === 'NO_BALL' ? b.extraRuns : 0);
        bowler.runsConceded += bowlerCharge;

        if (deliveryTotalRuns === 0 && b.isLegalDelivery) {
          bowler.dots++;
        }

        // Track maiden overs
        const overIdx = b.overNumber;
        if (!overBowlerStats[overIdx]) {
          overBowlerStats[overIdx] = { bowlerId: b.bowlerId, legalBalls: 0, bowlerRuns: 0 };
        }
        if (b.isLegalDelivery) {
          overBowlerStats[overIdx].legalBalls++;
        }
        overBowlerStats[overIdx].bowlerRuns += bowlerCharge;

        bowler.economy =
          bowler.legalDeliveries > 0
            ? Number(((bowler.runsConceded / bowler.legalDeliveries) * 6).toFixed(2))
            : 0;
      }

      // Track partnership
      if (currentPartnership) {
        currentPartnership.runs += deliveryTotalRuns;
        if (b.extraType !== 'WIDE') {
          currentPartnership.balls++;
        }
      }

      // Handle Wicket
      if (b.wicket) {
        wickets++;
        const dismissed = batters[b.wicket.dismissedPlayerId];
        if (dismissed) {
          dismissed.isOut = true;
          dismissed.isBatting = false;
          dismissed.isOnStrike = false;

          const fName = b.wicket.fielderName ? ` (${b.wicket.fielderName})` : '';
          const bName = b.bowlerName;

          switch (b.wicket.type) {
            case 'BOWLED':
              dismissed.dismissalText = `b ${bName}`;
              if (bowler) bowler.wickets++;
              break;
            case 'CAUGHT':
              dismissed.dismissalText = `c ${b.wicket.fielderName || 'fielder'} b ${bName}`;
              if (bowler) bowler.wickets++;
              break;
            case 'LBW':
              dismissed.dismissalText = `lbw b ${bName}`;
              if (bowler) bowler.wickets++;
              break;
            case 'STUMPED':
              dismissed.dismissalText = `st ${b.wicket.fielderName || 'wk'} b ${bName}`;
              if (bowler) bowler.wickets++;
              break;
            case 'HIT_WICKET':
              dismissed.dismissalText = `hit wicket b ${bName}`;
              if (bowler) bowler.wickets++;
              break;
            case 'RUN_OUT':
              dismissed.dismissalText = `run out${fName}`;
              // Run out does NOT credit bowler
              break;
            case 'RETIRED_HURT':
              dismissed.dismissalText = 'retired hurt';
              wickets--; // Retired hurt does not count as wicket fallen
              break;
            case 'RETIRED_OUT':
              dismissed.dismissalText = 'retired out';
              break;
            default:
              dismissed.dismissalText = `out (${b.wicket.type.toLowerCase()})`;
              break;
          }

          // Record Fall of Wicket
          const curOvers = `${Math.floor(legalDeliveries / 6)}.${legalDeliveries % 6}`;
          fallOfWickets.push({
            wicketNumber: wickets,
            score: totalRuns,
            overs: curOvers,
            dismissedPlayerId: dismissed.playerId,
            dismissedPlayerName: dismissed.name,
          });
        }
      }

      // Determine next Free Hit state
      if (rules.freeHitOnNoBall) {
        if (b.extraType === 'NO_BALL') {
          isFreeHit = true;
        } else if (b.isLegalDelivery) {
          isFreeHit = false;
        }
        // If delivery was a Wide on a Free Hit, Free Hit remains active
      }

      // Strike Rotation Logic
      // 1. Odd runs off bat or odd byes/leg-byes cause physical rotation
      let rotatedDuringPlay = false;
      const physicalRuns = b.runsOffBat + (b.extraType === 'BYE' || b.extraType === 'LEG_BYE' ? b.extraRuns : 0);
      if (physicalRuns % 2 !== 0) {
        rotatedDuringPlay = true;
      }

      let nextStriker = b.strikerId;
      let nextNonStriker = b.nonStrikerId;

      if (rotatedDuringPlay) {
        nextStriker = b.nonStrikerId;
        nextNonStriker = b.strikerId;
      }

      // 2. If wicket fell:
      if (b.wicket) {
        // Find next incoming batter who hasn't batted
        const nextBatter = battingTeam.players.find((p) => !batters[p.id].isBatting && !batters[p.id].isOut);
        const incomingId = nextBatter ? nextBatter.id : null;

        if (b.wicket.dismissedPlayerId === nextStriker) {
          nextStriker = incomingId || '';
        } else if (b.wicket.dismissedPlayerId === nextNonStriker) {
          nextNonStriker = incomingId || '';
        }

        if (incomingId && batters[incomingId]) {
          batters[incomingId].isBatting = true;
        }

        // Reset partnership for new pair
        if (nextStriker && nextNonStriker && batters[nextStriker] && batters[nextNonStriker]) {
          currentPartnership = {
            batter1Id: nextStriker,
            batter1Name: batters[nextStriker].name,
            batter2Id: nextNonStriker,
            batter2Name: batters[nextNonStriker].name,
            runs: 0,
            balls: 0,
          };
        } else {
          currentPartnership = null;
        }
      }

      // 3. End of Over Strike Rotation (swap ends at the conclusion of 6 legal balls)
      if (b.isLegalDelivery && b.deliveryInOver === 6) {
        const temp = nextStriker;
        nextStriker = nextNonStriker;
        nextNonStriker = temp;
      }

      currentStrikerId = nextStriker || null;
      currentNonStrikerId = nextNonStriker || null;
      currentBowlerId = b.bowlerId;
    }

    // Compute maidens from recorded overs
    Object.values(overBowlerStats).forEach((stat) => {
      if (stat.legalBalls === 6 && stat.bowlerRuns === 0) {
        if (bowlers[stat.bowlerId]) {
          bowlers[stat.bowlerId].maidens++;
        }
      }
    });

    // Mark active striker / non-striker in batters table
    Object.values(batters).forEach((b) => {
      b.isOnStrike = b.playerId === currentStrikerId;
    });

    // Mark active bowler
    Object.values(bowlers).forEach((b) => {
      b.isCurrentBowler = b.playerId === currentBowlerId;
    });

    const oversCompleted = Math.floor(legalDeliveries / 6);
    const ballsInCurrentOver = legalDeliveries % 6;
    const oversDisplay = `${oversCompleted}.${ballsInCurrentOver}`;
    const currentRunRate = legalDeliveries > 0 ? Number(((totalRuns / legalDeliveries) * 6).toFixed(2)) : 0;

    let requiredRunRate: number | undefined = undefined;
    if (target !== undefined) {
      const runsNeeded = target - totalRuns;
      const totalBallsAllowed = rules.totalOvers * 6;
      const ballsRemaining = Math.max(0, totalBallsAllowed - legalDeliveries);
      if (ballsRemaining > 0 && runsNeeded > 0) {
        requiredRunRate = Number(((runsNeeded / ballsRemaining) * 6).toFixed(2));
      } else if (runsNeeded <= 0) {
        requiredRunRate = 0;
      }
    }

    const allOut = wickets >= maxWickets;
    const maxOversReached = legalDeliveries >= rules.totalOvers * 6;
    const targetAchieved = target !== undefined && totalRuns >= target;
    const isCompleted = allOut || maxOversReached || targetAchieved;

    // Slice recent deliveries (up to last 12 balls for over timeline)
    const recentBalls = balls.slice(-12);

    return {
      inningsNumber: 1,
      battingTeamId: battingTeam.id,
      bowlingTeamId: bowlingTeam.id,
      totalRuns,
      wickets,
      legalDeliveries,
      oversCompleted,
      ballsInCurrentOver,
      oversDisplay,
      currentRunRate,
      requiredRunRate,
      target,
      currentStrikerId,
      currentNonStrikerId,
      currentBowlerId,
      isFreeHit,
      isCompleted,
      allOut,
      extras,
      recentBalls,
      batters,
      bowlers,
      fallOfWickets,
      currentPartnership,
    };
  }

  /**
   * Generates clean, authentic cricket commentary string for a delivery
   */
  public static generateCommentary(
    bowlerName: string,
    strikerName: string,
    runsOffBat: number,
    extraType: string,
    extraRuns: number,
    wicketType?: string,
    fielderName?: string
  ): string {
    if (wicketType) {
      switch (wicketType) {
        case 'BOWLED':
          return `OUT! ${bowlerName} knocks over the stumps! Clean bowled, absolute beauty!`;
        case 'CAUGHT':
          return `OUT! Caught by ${fielderName || 'the fielder'} off ${bowlerName}! High in the air and safely taken.`;
        case 'LBW':
          return `OUT! Huge shout for LBW, and the umpire raises the finger! Plumb in front off ${bowlerName}.`;
        case 'RUN_OUT':
          return `OUT! Direct hit by ${fielderName || 'the fielder'}! That was suicide single, out by yards.`;
        case 'STUMPED':
          return `OUT! Brilliant glovework by the keeper! Dragged his foot out, stumped off ${bowlerName}.`;
        default:
          return `WICKET! ${strikerName} departs (${wicketType.toLowerCase()}).`;
      }
    }

    if (extraType === 'WIDE') {
      const extraDesc = extraRuns > 1 ? ` plus ${extraRuns - 1} extra runs` : '';
      return `${bowlerName} sprays it down the leg side, called WIDE by the umpire${extraDesc}.`;
    }

    if (extraType === 'NO_BALL') {
      const batDesc = runsOffBat > 0 ? `, batters run ${runsOffBat}` : '';
      return `NO BALL! ${bowlerName} oversteps the crease${batDesc}. Free Hit signaled!`;
    }

    if (extraType === 'BYE') {
      return `Missed by both batter and keeper, sneaking ${extraRuns} Bye(s).`;
    }

    if (extraType === 'LEG_BYE') {
      return `Thuds off the pad into the vacant outfield, taken for ${extraRuns} Leg Bye(s).`;
    }

    if (runsOffBat === 6) {
      return `SIX! BOOM! ${strikerName} launches ${bowlerName} high and handsome over the ropes! Maximum!`;
    }

    if (runsOffBat === 4) {
      return `FOUR! Glorious stroke! ${strikerName} finds the gap and beats deep cover to the fence!`;
    }

    if (runsOffBat === 3) {
      return `Driven into the deep gap, great running between the wickets for three runs.`;
    }

    if (runsOffBat === 2) {
      return `Worked into mid-wicket with soft hands, easily scampering back for a brace.`;
    }

    if (runsOffBat === 1) {
      return `${bowlerName} to ${strikerName}, tapped gently into the off-side for a quick single.`;
    }

    return `${bowlerName} to ${strikerName}, good length delivery, solid defensive block. Dot ball.`;
  }

  /**
   * Recalculates Points Table with accurate ICC Net Run Rate (NRR) handling
   */
  public static calculatePointsTable(
    teams: TournamentTeam[],
    fixtures: MatchFixture[]
  ): PointsTableEntry[] {
    const tableMap: { [teamId: string]: PointsTableEntry } = {};

    teams.forEach((t) => {
      tableMap[t.id] = {
        teamId: t.id,
        teamName: t.name,
        shortCode: t.shortCode,
        color: t.color,
        played: 0,
        won: 0,
        lost: 0,
        tied: 0,
        noResult: 0,
        points: 0,
        runsScored: 0,
        legalOversFaced: 0,
        runsConceded: 0,
        legalOversBowled: 0,
        netRunRate: 0,
      };
    });

    fixtures.forEach((match) => {
      if (match.status !== 'COMPLETED' || !match.firstInnings || !match.secondInnings) {
        return;
      }

      const inn1 = match.firstInnings;
      const inn2 = match.secondInnings;
      const team1 = tableMap[inn1.battingTeamId];
      const team2 = tableMap[inn2.battingTeamId];

      if (!team1 || !team2) return;

      team1.played++;
      team2.played++;

      // Winner & Points evaluation
      if (match.result?.isTie) {
        team1.tied++;
        team2.tied++;
        team1.points += 1;
        team2.points += 1;
      } else if (match.result?.isNoResult) {
        team1.noResult++;
        team2.noResult++;
        team1.points += 1;
        team2.points += 1;
      } else if (match.result?.winnerTeamId === team1.teamId) {
        team1.won++;
        team1.points += 2;
        team2.lost++;
      } else if (match.result?.winnerTeamId === team2.teamId) {
        team2.won++;
        team2.points += 2;
        team1.lost++;
      }

      // Net Run Rate: If all out, team is deemed to have faced the full quota of overs
      const maxOvers = match.rules.totalOvers;
      const inn1OversFaced = inn1.allOut ? maxOvers : inn1.legalDeliveries / 6;
      const inn2OversFaced = inn2.allOut ? maxOvers : inn2.legalDeliveries / 6;

      team1.runsScored += inn1.totalRuns;
      team1.legalOversFaced += inn1OversFaced;
      team1.runsConceded += inn2.totalRuns;
      team1.legalOversBowled += inn2OversFaced;

      team2.runsScored += inn2.totalRuns;
      team2.legalOversFaced += inn2OversFaced;
      team2.runsConceded += inn1.totalRuns;
      team2.legalOversBowled += inn1OversFaced;
    });

    // Compute NRR for each team
    const entries = Object.values(tableMap).map((entry) => {
      const forRR = entry.legalOversFaced > 0 ? entry.runsScored / entry.legalOversFaced : 0;
      const againstRR = entry.legalOversBowled > 0 ? entry.runsConceded / entry.legalOversBowled : 0;
      entry.netRunRate = Number((forRR - againstRR).toFixed(3));
      return entry;
    });

    // Sort table by Points DESC, then NRR DESC, then Runs Scored DESC
    return entries.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.netRunRate !== a.netRunRate) return b.netRunRate - a.netRunRate;
      return b.runsScored - a.runsScored;
    });
  }
}
