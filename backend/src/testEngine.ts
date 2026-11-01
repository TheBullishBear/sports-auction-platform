import { AuctionStateMachine } from './stateMachine';
import { DatabaseManager } from './db';

async function runSystemVerification() {
  console.log('========================================================');
  console.log('🧪 RUNNING SPORTS AUCTION ENGINE VERIFICATION SUITE');
  console.log('========================================================\n');

  const sm = new AuctionStateMachine();
  const db = DatabaseManager.getInstance();

  // Reset to clean seed
  sm.resetAuction();
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} - ${detail || ''}`);
      failed++;
    }
  }

  // --- TEST 1: Put Player On Block & State Transition ---
  const selectRes = sm.selectPlayer('player-1'); // Virat Kohli, Base 2 Cr
  assert(selectRes.success, 'Auctioneer selects Player 1 (Virat Kohli) on the block');
  const snap1 = sm.getSnapshot();
  assert(snap1.session.status === 'BID_PENDING', 'Session status is BID_PENDING');
  assert(snap1.currentPlayer?.name === 'Virat Kohli', 'Current player is Virat Kohli');

  // --- TEST 2: Reject Bids when Auction Not Active ---
  const earlyBid = await sm.placeBid('player-1', 'team-mi', 20000000);
  assert(
    Boolean(!earlyBid.success && earlyBid.reason?.includes('not currently active')),
    'Reject bid before bidding is officially started'
  );

  // --- TEST 3: Start Bidding ---
  const startRes = sm.startBidding(20);
  assert(startRes.success, 'Bidding started with 20s clock');
  assert(sm.getSnapshot().session.status === 'BIDDING_ACTIVE', 'State is BIDDING_ACTIVE');

  // --- TEST 4: Opening Valid Bid ---
  const bid1 = await sm.placeBid('player-1', 'team-mi', 20000000); // 2.0 Cr base
  assert(bid1.success, 'Opening base bid of ₹2.00 Cr by MI accepted');
  const snap2 = sm.getSnapshot();
  assert(snap2.currentPlayer?.currentBid === 20000000, 'Current bid updated to ₹2.00 Cr');
  assert(snap2.currentPlayer?.currentHighBidderId === 'team-mi', 'High bidder is MI');

  // --- TEST 5: Self-Bidding Rejection ---
  const selfBid = await sm.placeBid('player-1', 'team-mi', 22500000);
  assert(
    Boolean(!selfBid.success && selfBid.reason?.includes('already holds the highest active bid')),
    'Self-bidding rejected when already highest bidder'
  );

  // --- TEST 6: Invalid Bid Under Minimum Increment ---
  // Next minimum bid should be 2.00 Cr + 25L (since >= 1 Cr) = 2.25 Cr
  const underBid = await sm.placeBid('player-1', 'team-csk', 21000000);
  assert(
    Boolean(!underBid.success && underBid.reason?.includes('lower than minimum allowed bid')),
    'Rejects bid below minimum slab increment'
  );

  // --- TEST 7: Counter Bid by CSK ---
  const bid2 = await sm.placeBid('player-1', 'team-csk', 22500000); // 2.25 Cr
  assert(bid2.success, 'Counter bid of ₹2.25 Cr by CSK accepted');

  // --- TEST 8: Concurrency Stress Test (Simultaneous Bids) ---
  console.log('\n⚡ Testing concurrent race condition handling (5 simultaneous bids)...');
  const concurrentBids = [
    sm.placeBid('player-1', 'team-rcb', 25000000),
    sm.placeBid('player-1', 'team-kkr', 25000000),
    sm.placeBid('player-1', 'team-gt', 25000000),
    sm.placeBid('player-1', 'team-srh', 25000000),
    sm.placeBid('player-1', 'team-mi', 25000000),
  ];

  const results = await Promise.all(concurrentBids);
  const successCount = results.filter((r) => r.success).length;
  assert(
    successCount === 1,
    'Exactly ONE team wins the bid at ₹2.50 Cr under simultaneous concurrency',
    `Successful bids count was ${successCount}`
  );

  // --- TEST 9: Digital Purse Overdraft Constraint ---
  // Artificially lower team-gt's purse to 10 Lakhs
  db.updateTeam('team-gt', { remainingPurse: 1000000 });
  const overdrawBid = await sm.placeBid('player-1', 'team-gt', 30000000);
  assert(
    Boolean(!overdrawBid.success && overdrawBid.reason?.includes('insufficient purse balance')),
    'Hard digital purse overdraft prevented'
  );

  // --- TEST 10: Purse Reserve Constraint ---
  // Team with 4.0 Cr remaining purse needs 2 more players (each at 20L base price = 40 Lakhs reserve)
  // minSlots = 11. currentSlots = 8. Needed = 11 - 8 - 1 = 2 slots -> 40L reserve needed.
  db.updateTeam('team-srh', {
    remainingPurse: 40000000, // 4.0 Cr
    currentSlots: 8,          // Needs 2 more to hit minSlots 11 -> 40L reserve needed
  });
  const reserveViolationBid = await sm.placeBid('player-1', 'team-srh', 38000000);
  assert(
    Boolean(!reserveViolationBid.success && reserveViolationBid.reason?.includes('must reserve')),
    'Purse reserve violation prevented (cannot strand squad below min roster)'
  );

  // --- TEST 11: Overseas Quota Constraint ---
  // Put overseas player on block
  sm.selectPlayer('player-3'); // Travis Head (Overseas)
  sm.startBidding(20);
  // Fill overseas slots for KKR
  db.updateTeam('team-kkr', { currentOverseas: 8, maxOverseas: 8 });
  const overseasFailBid = await sm.placeBid('player-3', 'team-kkr', 20000000);
  assert(
    Boolean(!overseasFailBid.success && overseasFailBid.reason?.includes('exhausted its overseas quota')),
    'Overseas roster limit constraint enforced'
  );

  // --- TEST 12: Hammer Strike & Atomic Settlement ---
  const validOverseasBid = await sm.placeBid('player-3', 'team-rcb', 20000000);
  assert(validOverseasBid.success, 'Valid overseas bid by RCB accepted');

  const rcbPurseBefore = db.getTeam('team-rcb')!.remainingPurse;
  const hammerRes = await sm.hammerStrike('SOLD');
  assert(hammerRes.success, 'Hammer dropped with SOLD');

  const rcbAfter = db.getTeam('team-rcb')!;
  const player3After = db.getPlayer('player-3')!;
  assert(player3After.status === 'SOLD', 'Player 3 status updated to SOLD');
  assert(player3After.winningTeamId === 'team-rcb', 'Player 3 assigned to RCB');
  assert(
    rcbAfter.remainingPurse === rcbPurseBefore - 20000000,
    'RCB purse debited atomically by exactly ₹2.00 Cr'
  );
  assert(rcbAfter.currentSlots === 1, 'RCB roster slots incremented to 1');
  assert(rcbAfter.currentOverseas === 1, 'RCB overseas slots incremented to 1');
  assert(rcbAfter.playersAcquired.includes('player-3'), 'Player 3 present in RCB acquired list');

  console.log('\n========================================================');
  console.log(`🏁 VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSystemVerification().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
