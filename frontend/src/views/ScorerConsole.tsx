import React, { useState } from 'react';
import {
  RotateCcw,
  Sun,
  Moon,
  AlertCircle,
  Trophy,
  Users,
  ShieldAlert,
  Flame,
  CheckCircle2,
  X,
  History,
  Check,
} from 'lucide-react';
import { useCricket } from '../context/CricketContext';
import { WicketType, ExtraType, BallEvent } from '../cricketTypes';

export const ScorerConsole: React.FC = () => {
  const {
    currentTournament,
    currentMatch,
    sunlightMode,
    toggleSunlightMode,
    recordBall,
    undoLastBall,
    editBall,
    updateToss,
    startInnings,
  } = useCricket();

  // Modals state
  const [showWicketModal, setShowWicketModal] = useState<boolean>(false);
  const [wicketType, setWicketType] = useState<WicketType>('CAUGHT');
  const [fielderId, setFielderId] = useState<string>('');
  const [nextBatterId, setNextBatterId] = useState<string>('');
  const [runOutBatterId, setRunOutBatterId] = useState<string>('');

  const [showBowlerModal, setShowBowlerModal] = useState<boolean>(false);
  const [selectedNextBowlerId, setSelectedNextBowlerId] = useState<string>('');

  const [showTossModal, setShowTossModal] = useState<boolean>(false);
  const [tossWinnerTeamId, setTossWinnerTeamId] = useState<string>('');
  const [tossDecision, setTossDecision] = useState<'BAT' | 'BOWL'>('BAT');

  const [showStartInningsModal, setShowStartInningsModal] = useState<boolean>(false);
  const [startStrikerId, setStartStrikerId] = useState<string>('');
  const [startNonStrikerId, setStartNonStrikerId] = useState<string>('');
  const [startBowlerId, setStartBowlerId] = useState<string>('');

  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [editingBallItem, setEditingBallItem] = useState<BallEvent | null>(null);
  const [editRuns, setEditRuns] = useState<number>(0);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!currentTournament || !currentMatch) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <Trophy className="w-12 h-12 text-amber-500 animate-bounce mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">No Active Match Selected</h2>
        <p className="text-slate-400 max-w-sm mb-4">
          Please select a tournament and match from the Tournament Hub to begin live scoring.
        </p>
      </div>
    );
  }

  const teamA = currentTournament.teams.find((t) => t.id === currentMatch.teamAId);
  const teamB = currentTournament.teams.find((t) => t.id === currentMatch.teamBId);

  const activeInningsNumber = currentMatch.currentInningsNumber;
  const activeInnings = activeInningsNumber === 1 ? currentMatch.firstInnings : currentMatch.secondInnings;

  const battingTeam =
    activeInnings?.battingTeamId === teamA?.id ? teamA : teamB || teamA;
  const bowlingTeam =
    activeInnings?.bowlingTeamId === teamA?.id ? teamA : teamB || teamB;

  const striker = activeInnings?.currentStrikerId
    ? activeInnings.batters[activeInnings.currentStrikerId]
    : null;
  const nonStriker = activeInnings?.currentNonStrikerId
    ? activeInnings.batters[activeInnings.currentNonStrikerId]
    : null;
  const bowler = activeInnings?.currentBowlerId
    ? activeInnings.bowlers[activeInnings.currentBowlerId]
    : null;

  // Simple vibration for mobile thumb haptic feedback
  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(40);
    }
  };

  // Quick delivery record helper
  const handleBallDelivery = async (
    runsOffBat: number,
    extraType: ExtraType = 'NONE',
    extraRuns: number = 0,
    wicketDetails?: { type: WicketType; dismissedPlayerId: string; fielderId?: string }
  ) => {
    if (!currentMatch || !activeInnings || isSubmitting) return;
    if (!activeInnings.currentStrikerId || !activeInnings.currentNonStrikerId || !activeInnings.currentBowlerId) {
      setShowStartInningsModal(true);
      return;
    }

    triggerHaptic();
    setIsSubmitting(true);

    const isLegal = extraType !== 'WIDE' && extraType !== 'NO_BALL';
    const totalRunsOnDelivery = runsOffBat + extraRuns;

    // Delivery in over calculation
    const currentLegalCount = activeInnings.ballsInCurrentOver;
    const overNumber = activeInnings.oversCompleted;
    const deliveryInOver = isLegal ? currentLegalCount + 1 : currentLegalCount;
    const displayOver = `${overNumber}.${deliveryInOver}`;

    const newBall: Partial<BallEvent> = {
      matchId: currentMatch.id,
      inningsNumber: activeInningsNumber,
      overNumber,
      deliveryInOver,
      displayOver,
      bowlerId: bowler?.playerId || '',
      bowlerName: bowler?.name || 'Bowler',
      strikerId: striker?.playerId || '',
      strikerName: striker?.name || 'Striker',
      nonStrikerId: nonStriker?.playerId || '',
      nonStrikerName: nonStriker?.name || 'Non-Striker',
      runsOffBat,
      extraType,
      extraRuns,
      totalRunsOnDelivery,
      isLegalDelivery: isLegal,
      isFreeHit: activeInnings.isFreeHit,
      wicket: wicketDetails
        ? {
            type: wicketDetails.type,
            dismissedPlayerId: wicketDetails.dismissedPlayerId,
            dismissedPlayerName:
              battingTeam?.players.find((p) => p.id === wicketDetails.dismissedPlayerId)?.name || '',
            fielderId: wicketDetails.fielderId,
            fielderName: bowlingTeam?.players.find((p) => p.id === wicketDetails.fielderId)?.name,
          }
        : undefined,
      commentary: `${runsOffBat} runs${extraType !== 'NONE' ? ` (${extraType})` : ''}`,
      timestamp: Date.now(),
    };

    await recordBall(newBall);
    setIsSubmitting(false);

    // If over completed, prompt for new bowler
    if (isLegal && deliveryInOver === 6) {
      setShowBowlerModal(true);
    }
  };

  const handleWicketSubmit = async () => {
    const dismissedId =
      wicketType === 'RUN_OUT' && runOutBatterId
        ? runOutBatterId
        : striker?.playerId || '';

    await handleBallDelivery(0, 'NONE', 0, {
      type: wicketType,
      dismissedPlayerId: dismissedId,
      fielderId: fielderId || undefined,
    });

    setShowWicketModal(false);
    setFielderId('');
    setNextBatterId('');
    setRunOutBatterId('');
  };

  const handleSelectNewBowler = () => {
    if (!selectedNextBowlerId) return;
    triggerHaptic();
    setShowBowlerModal(false);
  };

  // Sunlight mode styles
  const bgClass = sunlightMode ? 'bg-black text-yellow-300' : 'bg-slate-950 text-slate-100';
  const cardClass = sunlightMode ? 'bg-neutral-900 border-yellow-500 border-2' : 'bg-slate-900/80 border-slate-800 border';

  return (
    <div className={`min-h-screen ${bgClass} pb-24 transition-colors`}>
      {/* Top Mobile Bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-slate-900/90 backdrop-blur border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-bold tracking-wider uppercase text-emerald-400">Scorer Desk</span>
          <span className="text-xs text-slate-400 truncate max-w-[140px] sm:max-w-xs">{currentMatch.title}</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={toggleSunlightMode}
            title="Toggle Outdoor Sunlight Mode"
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-amber-400 hover:bg-slate-700 transition"
          >
            {sunlightMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setShowHistoryModal(true)}
            title="Edit Deliveries Ledger"
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
          >
            <History className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-md mx-auto p-4 space-y-4">
        {/* Match Not Ready / Toss Pending Notice */}
        {currentMatch.status === 'UPCOMING' && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
            <ShieldAlert className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <h3 className="font-bold text-amber-300">Toss Not Conducted</h3>
            <p className="text-xs text-slate-300 mt-1 mb-3">Conduct the toss to set batting and bowling teams.</p>
            <button
              onClick={() => setShowTossModal(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm rounded-lg shadow-lg"
            >
              Conduct Toss Now
            </button>
          </div>
        )}

        {/* Free Hit Banner */}
        {activeInnings?.isFreeHit && (
          <div className="flex items-center justify-center space-x-2 py-2 px-3 rounded-lg bg-yellow-500 text-black font-black text-sm tracking-wide animate-bounce shadow-lg">
            <Flame className="w-5 h-5 fill-black" />
            <span>⚡ FREE HIT NEXT BALL ⚡</span>
          </div>
        )}

        {/* Hero Score Ribbon */}
        {activeInnings && (
          <section className={`p-4 rounded-2xl ${cardClass} shadow-xl`}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: battingTeam?.color || '#0284c7' }}
                ></span>
                <span>{battingTeam?.name}</span>
                <span className="text-slate-400 text-xs font-normal">
                  ({activeInningsNumber === 1 ? '1st Innings' : '2nd Innings'})
                </span>
              </span>

              {activeInnings.target && (
                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                  Target: {activeInnings.target}
                </span>
              )}
            </div>

            <div className="flex items-baseline justify-between mt-2">
              <div className="flex items-baseline space-x-2">
                <span className="text-5xl font-black tracking-tight">
                  {activeInnings.totalRuns}
                  <span className="text-3xl text-slate-400 font-bold">/{activeInnings.wickets}</span>
                </span>
                <span className="text-lg text-slate-400 font-semibold">
                  ({activeInnings.oversDisplay} / {currentMatch.rules.totalOvers} ov)
                </span>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-400 font-medium">CRR</div>
                <div className="text-base font-bold text-emerald-400">{activeInnings.currentRunRate}</div>
              </div>
            </div>

            {/* Chasing Math */}
            {activeInnings.target && (
              <div className="mt-3 pt-3 border-t border-slate-800/80 flex justify-between items-center text-xs">
                <span className="text-slate-300">
                  Need{' '}
                  <span className="font-bold text-amber-400">
                    {Math.max(0, activeInnings.target - activeInnings.totalRuns)}
                  </span>{' '}
                  runs in{' '}
                  <span className="font-bold text-amber-400">
                    {Math.max(0, currentMatch.rules.totalOvers * 6 - activeInnings.legalDeliveries)}
                  </span>{' '}
                  balls
                </span>
                <span className="text-slate-400">
                  RRR: <span className="font-bold text-rose-400">{activeInnings.requiredRunRate || 0}</span>
                </span>
              </div>
            )}
          </section>
        )}

        {/* Batters On Pitch (Mobile Tap Cards) */}
        {activeInnings && (
          <section className="grid grid-cols-2 gap-2">
            {/* Striker */}
            <div
              className={`p-3 rounded-xl border-2 transition ${
                striker
                  ? 'bg-amber-500/10 border-amber-500 shadow-md shadow-amber-500/10'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold uppercase text-amber-400 flex items-center space-x-1">
                  <span>🏏 Striker</span>
                </span>
              </div>
              <div className="font-bold text-base mt-1 truncate">{striker?.name || 'Select Striker'}</div>
              <div className="text-xs text-slate-400 mt-0.5">
                <span className="text-white font-bold text-sm">{striker?.runs || 0}</span> ({striker?.ballsFaced || 0}b){' '}
                • {striker?.fours || 0}x4, {striker?.sixes || 0}x6
              </div>
            </div>

            {/* Non-Striker */}
            <div className={`p-3 rounded-xl border border-slate-800 bg-slate-900/60`}>
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-slate-400">Non-Striker</span>
              </div>
              <div className="font-bold text-base mt-1 truncate text-slate-300">{nonStriker?.name || 'Select'}</div>
              <div className="text-xs text-slate-400 mt-0.5">
                <span className="text-slate-200 font-bold text-sm">{nonStriker?.runs || 0}</span> (
                {nonStriker?.ballsFaced || 0}b)
              </div>
            </div>
          </section>
        )}

        {/* Active Bowler Card */}
        {bowler && (
          <section className={`p-3 rounded-xl ${cardClass} flex justify-between items-center`}>
            <div>
              <div className="text-xs text-slate-400 font-semibold">Bowler</div>
              <div className="font-bold text-base text-white truncate max-w-[180px]">{bowler.name}</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-sm font-bold text-emerald-400">
                {bowler.oversDisplay} - {bowler.maidens} - {bowler.runsConceded} - {bowler.wickets}
              </div>
              <div className="text-xs text-slate-400">Econ: {bowler.economy}</div>
            </div>
          </section>
        )}

        {/* Recent Balls Over Ticker */}
        {activeInnings && (
          <section className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400 font-medium px-1">
              <span>This Over:</span>
              <span>{activeInnings.ballsInCurrentOver} of 6 legal balls</span>
            </div>
            <div className="flex items-center space-x-1.5 overflow-x-auto py-1">
              {activeInnings.recentBalls.slice(-6).map((b, idx) => {
                let badgeColor = 'bg-slate-800 text-slate-200 border-slate-700';
                if (b.runsOffBat === 4) badgeColor = 'bg-emerald-600 text-white border-emerald-400 font-bold';
                else if (b.runsOffBat === 6) badgeColor = 'bg-purple-600 text-white border-purple-400 font-black';
                else if (b.wicket) badgeColor = 'bg-rose-600 text-white border-rose-400 font-bold';
                else if (b.extraType === 'WIDE' || b.extraType === 'NO_BALL')
                  badgeColor = 'bg-amber-600 text-white border-amber-400';

                const displayTxt = b.wicket
                  ? 'W'
                  : b.extraType === 'WIDE'
                  ? `${b.extraRuns}wd`
                  : b.extraType === 'NO_BALL'
                  ? `${b.extraRuns + b.runsOffBat}nb`
                  : b.runsOffBat === 0
                  ? '•'
                  : b.runsOffBat;

                return (
                  <span
                    key={idx}
                    className={`min-w-[36px] h-9 px-2 flex items-center justify-center rounded-lg border text-xs font-mono shadow ${badgeColor}`}
                  >
                    {displayTxt}
                  </span>
                );
              })}
              {activeInnings.recentBalls.length === 0 && (
                <span className="text-xs text-slate-500 italic">No deliveries yet in this innings.</span>
              )}
            </div>
          </section>
        )}

        {/* Thumb Keypad: Large Touch Targets */}
        <section className="pt-2 space-y-2.5">
          {/* Numeric Run Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map((runs) => (
              <button
                key={runs}
                disabled={isSubmitting || currentMatch.status !== 'LIVE'}
                onClick={() => handleBallDelivery(runs)}
                className="min-h-[58px] text-2xl font-black rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white border border-slate-700 shadow-md transition disabled:opacity-40"
              >
                {runs === 0 ? '•' : runs}
              </button>
            ))}
          </div>

          {/* Boundaries: 4 & 6 */}
          <div className="grid grid-cols-2 gap-2">
            <button
              disabled={isSubmitting || currentMatch.status !== 'LIVE'}
              onClick={() => handleBallDelivery(4)}
              className="min-h-[58px] text-2xl font-black rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white border border-emerald-400/50 shadow-lg shadow-emerald-900/30 transition disabled:opacity-40"
            >
              4 (FOUR)
            </button>
            <button
              disabled={isSubmitting || currentMatch.status !== 'LIVE'}
              onClick={() => handleBallDelivery(6)}
              className="min-h-[58px] text-2xl font-black rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white border border-purple-400/50 shadow-lg shadow-purple-900/30 transition disabled:opacity-40"
            >
              6 (SIX)
            </button>
          </div>

          {/* Extras Row */}
          <div className="grid grid-cols-4 gap-2 text-xs font-bold">
            <button
              disabled={isSubmitting || currentMatch.status !== 'LIVE'}
              onClick={() => handleBallDelivery(0, 'WIDE', 1)}
              className="min-h-[46px] rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 active:scale-95 transition disabled:opacity-40"
            >
              +1 Wide
            </button>
            <button
              disabled={isSubmitting || currentMatch.status !== 'LIVE'}
              onClick={() => handleBallDelivery(0, 'NO_BALL', 1)}
              className="min-h-[46px] rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 active:scale-95 transition disabled:opacity-40"
            >
              +1 No Ball
            </button>
            <button
              disabled={isSubmitting || currentMatch.status !== 'LIVE'}
              onClick={() => handleBallDelivery(0, 'BYE', 1)}
              className="min-h-[46px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 active:scale-95 transition disabled:opacity-40"
            >
              +1 Bye
            </button>
            <button
              disabled={isSubmitting || currentMatch.status !== 'LIVE'}
              onClick={() => handleBallDelivery(0, 'LEG_BYE', 1)}
              className="min-h-[46px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 active:scale-95 transition disabled:opacity-40"
            >
              +1 Leg Bye
            </button>
          </div>

          {/* Wicket & Undo Actions */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              disabled={isSubmitting || currentMatch.status !== 'LIVE'}
              onClick={() => setShowWicketModal(true)}
              className="min-h-[52px] font-black text-sm tracking-wide rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white border border-rose-400/50 shadow-lg shadow-rose-950/40 transition disabled:opacity-40 flex items-center justify-center space-x-2"
            >
              <span>🚨 OUT / WICKET</span>
            </button>

            <button
              disabled={isSubmitting || !activeInnings || activeInnings.recentBalls.length === 0}
              onClick={async () => {
                triggerHaptic();
                await undoLastBall();
              }}
              className="min-h-[52px] font-bold text-sm rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-amber-400 border border-slate-700 shadow transition disabled:opacity-40 flex items-center justify-center space-x-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Undo Ball</span>
            </button>
          </div>
        </section>
      </main>

      {/* MODAL 1: WICKET MODAL */}
      {showWicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-rose-400 flex items-center space-x-2">
                <span>Fall of Wicket</span>
              </h3>
              <button onClick={() => setShowWicketModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dismissal Type Selector */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-semibold">Dismissal Type</label>
              <select
                value={wicketType}
                onChange={(e) => setWicketType(e.target.value as WicketType)}
                className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-medium"
              >
                <option value="BOWLED">Bowled</option>
                <option value="CAUGHT">Caught</option>
                <option value="LBW">LBW</option>
                <option value="RUN_OUT">Run Out</option>
                <option value="STUMPED">Stumped</option>
                <option value="HIT_WICKET">Hit Wicket</option>
                <option value="RETIRED_HURT">Retired Hurt</option>
                <option value="RETIRED_OUT">Retired Out</option>
              </select>
            </div>

            {/* Run Out: Which batter was dismissed */}
            {wicketType === 'RUN_OUT' && (
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-semibold">Batter Run Out</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRunOutBatterId(striker?.playerId || '')}
                    className={`p-2 text-xs font-bold rounded-lg border ${
                      runOutBatterId === striker?.playerId
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    Striker: {striker?.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRunOutBatterId(nonStriker?.playerId || '')}
                    className={`p-2 text-xs font-bold rounded-lg border ${
                      runOutBatterId === nonStriker?.playerId
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    Non-Striker: {nonStriker?.name}
                  </button>
                </div>
              </div>
            )}

            {/* Fielder Selector (if caught / run out / stumped) */}
            {(wicketType === 'CAUGHT' || wicketType === 'RUN_OUT' || wicketType === 'STUMPED') && (
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-semibold">Fielder / Catcher / Keeper</label>
                <select
                  value={fielderId}
                  onChange={(e) => setFielderId(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-medium"
                >
                  <option value="">Select Fielder (optional)</option>
                  {bowlingTeam?.players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={handleWicketSubmit}
              className="w-full py-3 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold rounded-xl shadow-lg transition"
            >
              Confirm Wicket
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: NEXT BOWLER MODAL (End of Over) */}
      {showBowlerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-amber-400">Over Completed!</h3>
            </div>
            <p className="text-xs text-slate-300">
              6 legal deliveries bowled. Ends have swapped automatically. Select the bowler for the next over:
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {bowlingTeam?.players
                .filter((p) => p.id !== bowler?.playerId) // Consecutive overs by same bowler disallowed
                .map((p) => {
                  const spell = activeInnings?.bowlers[p.id];
                  const oversDone = spell ? Math.floor(spell.legalDeliveries / 6) : 0;
                  const maxAllowed = currentMatch.rules.maxOversPerBowler;
                  const isMaxedOut = oversDone >= maxAllowed;

                  return (
                    <button
                      key={p.id}
                      disabled={isMaxedOut}
                      onClick={() => setSelectedNextBowlerId(p.id)}
                      className={`w-full p-2.5 text-left rounded-lg border flex justify-between items-center ${
                        selectedNextBowlerId === p.id
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : isMaxedOut
                          ? 'bg-slate-900 border-slate-800 text-slate-600 opacity-50'
                          : 'bg-slate-800 border-slate-700 text-slate-200'
                      }`}
                    >
                      <span className="font-semibold text-sm">{p.name}</span>
                      <span className="text-xs text-slate-400">
                        {oversDone}/{maxAllowed} ov
                      </span>
                    </button>
                  );
                })}
            </div>

            <button
              disabled={!selectedNextBowlerId}
              onClick={handleSelectNewBowler}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-lg transition disabled:opacity-40"
            >
              Start Next Over
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: TOSS MODAL */}
      {showTossModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Match Toss</h3>

            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-semibold">Toss Winner</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTossWinnerTeamId(teamA?.id || '')}
                  className={`p-2.5 text-xs font-bold rounded-lg border ${
                    tossWinnerTeamId === teamA?.id
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  {teamA?.name}
                </button>
                <button
                  type="button"
                  onClick={() => setTossWinnerTeamId(teamB?.id || '')}
                  className={`p-2.5 text-xs font-bold rounded-lg border ${
                    tossWinnerTeamId === teamB?.id
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  {teamB?.name}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-semibold">Elected to</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTossDecision('BAT')}
                  className={`p-2.5 text-xs font-bold rounded-lg border ${
                    tossDecision === 'BAT'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  BAT FIRST
                </button>
                <button
                  type="button"
                  onClick={() => setTossDecision('BOWL')}
                  className={`p-2.5 text-xs font-bold rounded-lg border ${
                    tossDecision === 'BOWL'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  BOWL FIRST
                </button>
              </div>
            </div>

            <button
              disabled={!tossWinnerTeamId}
              onClick={async () => {
                await updateToss(tossWinnerTeamId, tossDecision);
                setShowTossModal(false);
              }}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl shadow-lg transition disabled:opacity-40"
            >
              Confirm Toss & Start Match
            </button>
          </div>
        </div>
      )}

      {/* MODAL 4: START INNINGS (Openers & Bowler) */}
      {showStartInningsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Select Playing Openers</h3>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-semibold">Opening Striker</label>
              <select
                value={startStrikerId}
                onChange={(e) => setStartStrikerId(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-medium"
              >
                <option value="">Select Striker</option>
                {battingTeam?.players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-semibold">Opening Non-Striker</label>
              <select
                value={startNonStrikerId}
                onChange={(e) => setStartNonStrikerId(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-medium"
              >
                <option value="">Select Non-Striker</option>
                {battingTeam?.players
                  .filter((p) => p.id !== startStrikerId)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-semibold">Opening Bowler</label>
              <select
                value={startBowlerId}
                onChange={(e) => setStartBowlerId(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-medium"
              >
                <option value="">Select Opening Bowler</option>
                {bowlingTeam?.players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              disabled={!startStrikerId || !startNonStrikerId || !startBowlerId}
              onClick={async () => {
                await startInnings(activeInningsNumber, startStrikerId, startNonStrikerId, startBowlerId);
                setShowStartInningsModal(false);
              }}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl shadow-lg transition disabled:opacity-40"
            >
              Begin Innings
            </button>
          </div>
        </div>
      )}

      {/* MODAL 5: BALL HISTORY & EDIT DRAWER */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <History className="w-5 h-5 text-amber-400" />
                <span>Deliveries Ledger (Audit / Edit)</span>
              </h3>
              <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {currentMatch.ballEvents.length === 0 ? (
                <p className="text-center text-slate-500 py-6">No balls recorded yet.</p>
              ) : (
                currentMatch.ballEvents
                  .slice()
                  .reverse()
                  .map((b) => (
                    <div
                      key={b.id}
                      className="p-3 rounded-lg bg-slate-800/80 border border-slate-700 flex justify-between items-center"
                    >
                      <div>
                        <div className="font-bold text-sm text-white">
                          Over {b.displayOver} • {b.strikerName} facing {b.bowlerName}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {b.runsOffBat} runs {b.extraType !== 'NONE' ? `(${b.extraType})` : ''}{' '}
                          {b.wicket ? `• WICKET (${b.wicket.type})` : ''}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setEditingBallItem(b);
                          setEditRuns(b.runsOffBat);
                        }}
                        className="px-2.5 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded text-amber-300 font-semibold"
                      >
                        Edit
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL: Edit Specific Ball */}
      {editingBallItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="w-full max-w-xs bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-4">
            <h4 className="font-bold text-white">Edit Ball {editingBallItem.displayOver}</h4>
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Runs off Bat</label>
              <div className="grid grid-cols-4 gap-2">
                {[0, 1, 2, 3, 4, 6].map((r) => (
                  <button
                    key={r}
                    onClick={() => setEditRuns(r)}
                    className={`py-2 text-sm font-bold rounded-lg border ${
                      editRuns === r
                        ? 'bg-amber-500 border-amber-400 text-black'
                        : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setEditingBallItem(null)}
                className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await editBall(editingBallItem.id, {
                    runsOffBat: editRuns,
                    totalRunsOnDelivery: editRuns + editingBallItem.extraRuns,
                  });
                  setEditingBallItem(null);
                }}
                className="flex-1 py-2 bg-emerald-500 text-black font-bold rounded-lg text-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
