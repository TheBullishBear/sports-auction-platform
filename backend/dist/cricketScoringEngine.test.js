"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cricketScoringEngine_1 = require("./cricketScoringEngine");
// Test Fixture Data
const teamA = {
    id: 'team-a',
    name: 'Mumbai Titans',
    shortCode: 'MT',
    color: '#0284c7',
    players: [
        { id: 'p1', name: 'Rohit', role: 'Batter' },
        { id: 'p2', name: 'Ishan', role: 'Wicketkeeper' },
        { id: 'p3', name: 'Surya', role: 'Batter' },
        { id: 'p4', name: 'Hardik', role: 'All-Rounder' },
    ],
};
const teamB = {
    id: 'team-b',
    name: 'Royal Kings',
    shortCode: 'RK',
    color: '#e11d48',
    players: [
        { id: 'b1', name: 'Bumrah', role: 'Bowler' },
        { id: 'b2', name: 'Boult', role: 'Bowler' },
        { id: 'b3', name: 'Chahal', role: 'Bowler' },
        { id: 'b4', name: 'Siraj', role: 'Bowler' },
    ],
};
const rules = {
    totalOvers: 5,
    maxOversPerBowler: 2,
    wideValue: 1,
    noBallValue: 1,
    freeHitOnNoBall: true,
};
function runUnitTests() {
    console.log('🧪 Running CricketScoringEngine Unit Tests...\n');
    let passed = 0;
    let failed = 0;
    function assert(condition, testName) {
        if (condition) {
            console.log(`  ✅ PASS: ${testName}`);
            passed++;
        }
        else {
            console.error(`  ❌ FAIL: ${testName}`);
            failed++;
        }
    }
    // TEST 1: Legal deliveries and extras
    {
        const balls = [
            {
                id: 'ball-1',
                matchId: 'm1',
                inningsNumber: 1,
                ballIndex: 0,
                overNumber: 0,
                deliveryInOver: 1,
                displayOver: '0.1',
                bowlerId: 'b1',
                bowlerName: 'Bumrah',
                strikerId: 'p1',
                strikerName: 'Rohit',
                nonStrikerId: 'p2',
                nonStrikerName: 'Ishan',
                runsOffBat: 0,
                extraType: 'WIDE',
                extraRuns: 1,
                totalRunsOnDelivery: 1,
                isLegalDelivery: false,
                isFreeHit: false,
                commentary: 'Wide ball',
                timestamp: Date.now(),
            },
            {
                id: 'ball-2',
                matchId: 'm1',
                inningsNumber: 1,
                ballIndex: 1,
                overNumber: 0,
                deliveryInOver: 1,
                displayOver: '0.1',
                bowlerId: 'b1',
                bowlerName: 'Bumrah',
                strikerId: 'p1',
                strikerName: 'Rohit',
                nonStrikerId: 'p2',
                nonStrikerName: 'Ishan',
                runsOffBat: 4,
                extraType: 'NONE',
                extraRuns: 0,
                totalRunsOnDelivery: 4,
                isLegalDelivery: true,
                isFreeHit: false,
                commentary: 'FOUR runs',
                timestamp: Date.now(),
            },
        ];
        const state = cricketScoringEngine_1.CricketScoringEngine.calculateInningsState(balls, teamA, teamB, rules);
        assert(state.totalRuns === 5, 'Total runs should be 5 (1 wide + 4 off bat)');
        assert(state.legalDeliveries === 1, 'Legal deliveries should be 1 (wide is not legal)');
        assert(state.oversDisplay === '0.1', 'Overs display should be 0.1');
        assert(state.extras.wides === 1, 'Wides extra should be 1');
        assert(state.batters['p1'].runs === 4, 'Rohit should have 4 runs');
        assert(state.batters['p1'].ballsFaced === 1, 'Rohit should have faced 1 ball (wide not faced)');
    }
    // TEST 2: Strike rotation on odd runs
    {
        const balls = [
            {
                id: 'b1',
                matchId: 'm1',
                inningsNumber: 1,
                ballIndex: 0,
                overNumber: 0,
                deliveryInOver: 1,
                displayOver: '0.1',
                bowlerId: 'b1',
                bowlerName: 'Bumrah',
                strikerId: 'p1',
                strikerName: 'Rohit',
                nonStrikerId: 'p2',
                nonStrikerName: 'Ishan',
                runsOffBat: 1,
                extraType: 'NONE',
                extraRuns: 0,
                totalRunsOnDelivery: 1,
                isLegalDelivery: true,
                isFreeHit: false,
                commentary: 'Single taken',
                timestamp: Date.now(),
            },
        ];
        const state = cricketScoringEngine_1.CricketScoringEngine.calculateInningsState(balls, teamA, teamB, rules);
        assert(state.currentStrikerId === 'p2', 'Strike should rotate to Ishan (p2) after a single');
        assert(state.currentNonStrikerId === 'p1', 'Rohit (p1) should now be non-striker');
    }
    // TEST 3: Free hit on No Ball
    {
        const balls = [
            {
                id: 'b1',
                matchId: 'm1',
                inningsNumber: 1,
                ballIndex: 0,
                overNumber: 0,
                deliveryInOver: 1,
                displayOver: '0.1',
                bowlerId: 'b1',
                bowlerName: 'Bumrah',
                strikerId: 'p1',
                strikerName: 'Rohit',
                nonStrikerId: 'p2',
                nonStrikerName: 'Ishan',
                runsOffBat: 0,
                extraType: 'NO_BALL',
                extraRuns: 1,
                totalRunsOnDelivery: 1,
                isLegalDelivery: false,
                isFreeHit: false,
                commentary: 'No Ball',
                timestamp: Date.now(),
            },
        ];
        const state = cricketScoringEngine_1.CricketScoringEngine.calculateInningsState(balls, teamA, teamB, rules);
        assert(state.isFreeHit === true, 'Next ball should be flagged as Free Hit after No Ball');
    }
    // TEST 4: Undo last ball (deterministic replay)
    {
        const ball1 = {
            id: 'b1',
            matchId: 'm1',
            inningsNumber: 1,
            ballIndex: 0,
            overNumber: 0,
            deliveryInOver: 1,
            displayOver: '0.1',
            bowlerId: 'b1',
            bowlerName: 'Bumrah',
            strikerId: 'p1',
            strikerName: 'Rohit',
            nonStrikerId: 'p2',
            nonStrikerName: 'Ishan',
            runsOffBat: 6,
            extraType: 'NONE',
            extraRuns: 0,
            totalRunsOnDelivery: 6,
            isLegalDelivery: true,
            isFreeHit: false,
            commentary: 'SIX',
            timestamp: Date.now(),
        };
        const ball2 = {
            id: 'b2',
            matchId: 'm1',
            inningsNumber: 1,
            ballIndex: 1,
            overNumber: 0,
            deliveryInOver: 2,
            displayOver: '0.2',
            bowlerId: 'b1',
            bowlerName: 'Bumrah',
            strikerId: 'p1',
            strikerName: 'Rohit',
            nonStrikerId: 'p2',
            nonStrikerName: 'Ishan',
            runsOffBat: 4,
            extraType: 'NONE',
            extraRuns: 0,
            totalRunsOnDelivery: 4,
            isLegalDelivery: true,
            isFreeHit: false,
            commentary: 'FOUR',
            timestamp: Date.now(),
        };
        const stateBeforeUndo = cricketScoringEngine_1.CricketScoringEngine.calculateInningsState([ball1, ball2], teamA, teamB, rules);
        assert(stateBeforeUndo.totalRuns === 10, 'Before undo total runs should be 10');
        // Undo ball2: simply replay with [ball1]
        const stateAfterUndo = cricketScoringEngine_1.CricketScoringEngine.calculateInningsState([ball1], teamA, teamB, rules);
        assert(stateAfterUndo.totalRuns === 6, 'After undoing ball2, total runs should revert precisely to 6');
        assert(stateAfterUndo.batters['p1'].fours === 0, 'Rohit fours should revert to 0');
    }
    // TEST 5: Points Table & NRR calculation
    {
        const mockFixture = {
            id: 'fix-1',
            tournamentId: 't1',
            matchNumber: 1,
            title: 'Match 1',
            teamAId: 'team-a',
            teamBId: 'team-b',
            status: 'COMPLETED',
            rules: { totalOvers: 20 },
            result: { winnerTeamId: 'team-a', margin: 'Mumbai Titans won by 20 runs' },
            firstInnings: {
                battingTeamId: 'team-a',
                bowlingTeamId: 'team-b',
                totalRuns: 160,
                legalDeliveries: 120, // 20.0 overs
                allOut: false,
            },
            secondInnings: {
                battingTeamId: 'team-b',
                bowlingTeamId: 'team-a',
                totalRuns: 140,
                legalDeliveries: 120, // 20.0 overs
                allOut: false,
            },
        };
        const table = cricketScoringEngine_1.CricketScoringEngine.calculatePointsTable([teamA, teamB], [mockFixture]);
        const mt = table.find((t) => t.teamId === 'team-a');
        const rk = table.find((t) => t.teamId === 'team-b');
        assert(mt !== undefined && mt.points === 2, 'Winner (team-a) should have 2 points');
        assert(rk !== undefined && rk.points === 0, 'Loser (team-b) should have 0 points');
        // Team A: 160/20 = 8.0 RR for, 140/20 = 7.0 RR against. NRR = +1.000
        assert(mt !== undefined && mt.netRunRate === 1.0, `Team A NRR should be +1.000 (got ${mt?.netRunRate})`);
        // Team B: 140/20 = 7.0 RR for, 160/20 = 8.0 RR against. NRR = -1.000
        assert(rk !== undefined && rk.netRunRate === -1.0, `Team B NRR should be -1.000 (got ${rk?.netRunRate})`);
    }
    console.log(`\nResults: ${passed} passed, ${failed} failed.`);
    if (failed > 0) {
        process.exit(1);
    }
}
runUnitTests();
