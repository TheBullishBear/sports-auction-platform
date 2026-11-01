import React, { useState, useRef } from 'react';
import {
  Trophy,
  Flame,
  Share2,
  Download,
  Copy,
  Check,
  Radio,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useCricket } from '../context/CricketContext';

export const PublicMatchCenter: React.FC = () => {
  const { currentTournament, currentMatch, isConnected } = useCricket();
  const [activeTab, setActiveTab] = useState<'LIVE' | 'SCORECARD' | 'COMMENTARY' | 'SHARE'>('LIVE');
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  if (!currentTournament || !currentMatch) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 text-slate-400">
        <Trophy className="w-12 h-12 text-amber-500 animate-bounce mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Select a Live Match</h2>
        <p className="max-w-sm">No match currently selected. Visit the Tournament Hub to follow a live game.</p>
      </div>
    );
  }

  const teamA = currentTournament.teams.find((t) => t.id === currentMatch.teamAId);
  const teamB = currentTournament.teams.find((t) => t.id === currentMatch.teamBId);

  const activeInningsNumber = currentMatch.currentInningsNumber;
  const activeInnings = activeInningsNumber === 1 ? currentMatch.firstInnings : currentMatch.secondInnings;

  const battingTeam = activeInnings?.battingTeamId === teamA?.id ? teamA : teamB || teamA;
  const bowlingTeam = activeInnings?.bowlingTeamId === teamA?.id ? teamA : teamB || teamB;

  const striker = activeInnings?.currentStrikerId ? activeInnings.batters[activeInnings.currentStrikerId] : null;
  const nonStriker = activeInnings?.currentNonStrikerId ? activeInnings.batters[activeInnings.currentNonStrikerId] : null;
  const bowler = activeInnings?.currentBowlerId ? activeInnings.bowlers[activeInnings.currentBowlerId] : null;

  // WhatsApp text copy generator
  const handleCopyWhatsAppSummary = () => {
    if (!activeInnings) return;

    const shareUrl = window.location.href;
    const summary = `🏏 *${currentTournament.name}*\n📍 ${currentMatch.title}\n\n*${battingTeam?.name}*: ${
      activeInnings.totalRuns
    }/${activeInnings.wickets} (${activeInnings.oversDisplay}/${currentMatch.rules.totalOvers} ov)\n${
      striker ? `*${striker.name}*: ${striker.runs}* (${striker.ballsFaced}b, ${striker.fours}x4, ${striker.sixes}x6)\n` : ''
    }${
      nonStriker ? `*${nonStriker.name}*: ${nonStriker.runs}* (${nonStriker.ballsFaced}b)\n` : ''
    }${bowler ? `*${bowler.name}*: ${bowler.oversDisplay} ov, ${bowler.runsConceded}-${bowler.wickets}\n` : ''}${
      activeInnings.target ? `Target: ${activeInnings.target} (Need ${activeInnings.target - activeInnings.totalRuns} off ${
        currentMatch.rules.totalOvers * 6 - activeInnings.legalDeliveries
      }b)\n` : ''
    }\n👉 Follow Live Ball-by-Ball: ${shareUrl}`;

    navigator.clipboard.writeText(summary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  // Generate Scorecard Image on Canvas
  const handleDownloadScorecardImage = () => {
    if (!canvasRef.current || !activeInnings) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 600;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 800, 600);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 600);

    // Accent line
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(0, 0, 800, 10);

    // Tournament Name & Header
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px system-ui';
    ctx.fillText(currentTournament.name.toUpperCase(), 40, 50);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px system-ui';
    ctx.fillText(`${currentMatch.title} • ${currentMatch.venue}`, 40, 80);

    // Scorebox
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(40, 110, 720, 160, 16);
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 20px system-ui';
    ctx.fillText(battingTeam?.name || 'Batting Team', 60, 150);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 54px system-ui';
    ctx.fillText(`${activeInnings.totalRuns}/${activeInnings.wickets}`, 60, 220);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '24px system-ui';
    ctx.fillText(`(${activeInnings.oversDisplay} / ${currentMatch.rules.totalOvers} ov)`, 230, 215);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 18px system-ui';
    ctx.fillText(`CRR: ${activeInnings.currentRunRate}`, 600, 215);

    // Batters & Bowler stats
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px system-ui';
    ctx.fillText('TOP BATTERS', 40, 310);

    let y = 345;
    Object.values(activeInnings.batters)
      .filter((b) => b.isBatting || b.isOut)
      .slice(0, 4)
      .forEach((b) => {
        ctx.fillStyle = b.isOnStrike ? '#f59e0b' : '#e2e8f0';
        ctx.font = '16px system-ui';
        ctx.fillText(`${b.name}${b.isOnStrike ? '*' : ''}`, 40, y);
        ctx.fillText(`${b.runs} (${b.ballsFaced}b) • ${b.fours}x4, ${b.sixes}x6`, 280, y);
        ctx.fillStyle = '#64748b';
        ctx.fillText(b.dismissalText, 520, y);
        y += 35;
      });

    // Footer
    ctx.fillStyle = '#64748b';
    ctx.font = '14px system-ui';
    ctx.fillText('Live Cricket Scoring Platform • Generated Instantly', 40, 560);

    // Download image
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${battingTeam?.shortCode || 'match'}-scorecard.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Top Match Bar */}
      <div className="sticky top-0 z-20 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Live Match Center</span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-xs text-slate-400 truncate max-w-[200px]">{currentTournament.name}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyWhatsAppSummary}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
            >
              {copiedSummary ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSummary ? 'Copied!' : 'Share WhatsApp'}</span>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Match Result Banner (If Completed) */}
        {currentMatch.status === 'COMPLETED' && currentMatch.result && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-teal-500/20 border border-amber-500/30 text-center shadow-xl">
            <Trophy className="w-8 h-8 text-amber-400 mx-auto mb-1 animate-bounce" />
            <h2 className="text-xl font-black text-white">{currentMatch.result.margin}</h2>
            <p className="text-xs text-slate-300 mt-1">Match Concluded • Full Scorecard Finalized</p>
          </div>
        )}

        {/* Hero Scoreboard Card */}
        {activeInnings && (
          <section className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <span className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800 text-xs font-bold text-amber-400 border border-slate-700 mb-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: battingTeam?.color || '#0284c7' }}
                  ></span>
                  <span>{battingTeam?.name}</span>
                  <span className="text-slate-400 font-normal">
                    ({activeInningsNumber === 1 ? '1st Innings' : '2nd Innings'})
                  </span>
                </span>
                <div className="flex items-baseline space-x-3 mt-1">
                  <span className="text-5xl sm:text-6xl font-black tracking-tight text-white">
                    {activeInnings.totalRuns}
                    <span className="text-3xl sm:text-4xl text-slate-400 font-bold">/{activeInnings.wickets}</span>
                  </span>
                  <span className="text-xl sm:text-2xl text-slate-400 font-semibold">
                    ({activeInnings.oversDisplay} / {currentMatch.rules.totalOvers} ov)
                  </span>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block font-medium">CRR</span>
                    <span className="text-lg font-bold text-emerald-400">{activeInnings.currentRunRate}</span>
                  </div>
                  {activeInnings.target && (
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block font-medium">RRR</span>
                      <span className="text-lg font-bold text-rose-400">{activeInnings.requiredRunRate || 0}</span>
                    </div>
                  )}
                </div>

                {activeInnings.target && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    Need {Math.max(0, activeInnings.target - activeInnings.totalRuns)} runs in{' '}
                    {Math.max(0, currentMatch.rules.totalOvers * 6 - activeInnings.legalDeliveries)} balls
                  </span>
                )}
              </div>
            </div>

            {/* Live Batter & Bowler Overview Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-sm">
              {/* Striker */}
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
                <span className="text-xs text-amber-400 font-bold uppercase flex items-center space-x-1">
                  <span>🏏 Striker</span>
                </span>
                <div className="font-bold text-white text-base mt-1 truncate">{striker?.name || 'On Strike'}</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  <span className="text-white font-bold">{striker?.runs || 0}</span> ({striker?.ballsFaced || 0}b) • SR:{' '}
                  {striker?.strikeRate || 0}
                </div>
              </div>

              {/* Non-Striker */}
              <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-800">
                <span className="text-xs text-slate-400 font-semibold">Non-Striker</span>
                <div className="font-bold text-slate-200 text-base mt-1 truncate">{nonStriker?.name || 'Waiting'}</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  <span className="text-white font-bold">{nonStriker?.runs || 0}</span> ({nonStriker?.ballsFaced || 0}
                  b)
                </div>
              </div>

              {/* Bowler */}
              <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-800">
                <span className="text-xs text-slate-400 font-semibold">Current Bowler</span>
                <div className="font-bold text-white text-base mt-1 truncate">{bowler?.name || 'Bowling'}</div>
                <div className="text-xs font-mono text-emerald-400 mt-0.5">
                  {bowler?.oversDisplay || '0.0'} ov • {bowler?.runsConceded || 0} runs • {bowler?.wickets || 0} wkts
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 space-x-2">
          {(['LIVE', 'SCORECARD', 'COMMENTARY', 'SHARE'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-3 text-sm font-bold border-b-2 transition ${
                activeTab === tab
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab === 'LIVE'
                ? 'Live View'
                : tab === 'SCORECARD'
                ? 'Full Scorecard'
                : tab === 'COMMENTARY'
                ? 'Commentary'
                : 'Share & Export'}
            </button>
          ))}
        </div>

        {/* TAB 1: LIVE VIEW & PARTNERSHIPS */}
        {activeTab === 'LIVE' && activeInnings && (
          <div className="space-y-4">
            {/* Current Partnership */}
            {activeInnings.currentPartnership && (
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Current Partnership
                  </span>
                  <div className="text-sm font-semibold text-white mt-1">
                    {activeInnings.currentPartnership.batter1Name} & {activeInnings.currentPartnership.batter2Name}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-amber-400">{activeInnings.currentPartnership.runs}</span>
                  <span className="text-xs text-slate-400 block">({activeInnings.currentPartnership.balls} balls)</span>
                </div>
              </div>
            )}

            {/* Recent Balls Strip */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recent Deliveries</span>
              <div className="flex items-center space-x-2 overflow-x-auto py-2">
                {activeInnings.recentBalls.slice(-12).map((b, idx) => {
                  let badge = 'bg-slate-800 text-slate-200 border-slate-700';
                  if (b.runsOffBat === 4) badge = 'bg-emerald-600 text-white font-bold';
                  else if (b.runsOffBat === 6) badge = 'bg-purple-600 text-white font-black';
                  else if (b.wicket) badge = 'bg-rose-600 text-white font-bold';
                  else if (b.extraType !== 'NONE') badge = 'bg-amber-600 text-white font-semibold';

                  return (
                    <span
                      key={idx}
                      className={`min-w-[40px] h-10 px-2 rounded-xl border flex items-center justify-center font-mono text-xs shadow-md ${badge}`}
                    >
                      {b.wicket
                        ? 'W'
                        : b.extraType === 'WIDE'
                        ? `${b.extraRuns}wd`
                        : b.extraType === 'NO_BALL'
                        ? `${b.extraRuns + b.runsOffBat}nb`
                        : b.runsOffBat === 0
                        ? '•'
                        : b.runsOffBat}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FULL SCORECARD */}
        {activeTab === 'SCORECARD' && activeInnings && (
          <div className="space-y-6">
            {/* Batting Card Table */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
              <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700/80 font-bold text-sm text-white flex justify-between items-center">
                <span>{battingTeam?.name} Innings</span>
                <span className="text-xs font-mono text-amber-400">
                  {activeInnings.totalRuns}/{activeInnings.wickets} ({activeInnings.oversDisplay} ov)
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-800/40 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4">Batter</th>
                      <th className="py-2.5 px-3">Dismissal</th>
                      <th className="py-2.5 px-3 text-right">R</th>
                      <th className="py-2.5 px-3 text-right">B</th>
                      <th className="py-2.5 px-3 text-right">4s</th>
                      <th className="py-2.5 px-3 text-right">6s</th>
                      <th className="py-2.5 px-4 text-right">SR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {Object.values(activeInnings.batters).map((b) => (
                      <tr key={b.playerId} className={b.isOnStrike ? 'bg-amber-500/5' : ''}>
                        <td className="py-3 px-4 font-bold text-white flex items-center space-x-1.5">
                          <span>{b.name}</span>
                          {b.isOnStrike && <span className="text-amber-400 font-black">*</span>}
                        </td>
                        <td className="py-3 px-3 text-slate-400 text-xs italic">{b.dismissalText}</td>
                        <td className="py-3 px-3 text-right font-black text-white">{b.runs}</td>
                        <td className="py-3 px-3 text-right text-slate-300">{b.ballsFaced}</td>
                        <td className="py-3 px-3 text-right text-emerald-400">{b.fours}</td>
                        <td className="py-3 px-3 text-right text-purple-400">{b.sixes}</td>
                        <td className="py-3 px-4 text-right text-slate-400 font-mono">{b.strikeRate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bowling Card Table */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
              <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700/80 font-bold text-sm text-white">
                <span>{bowlingTeam?.name} Bowling</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-800/40 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4">Bowler</th>
                      <th className="py-2.5 px-3 text-right">O</th>
                      <th className="py-2.5 px-3 text-right">M</th>
                      <th className="py-2.5 px-3 text-right">R</th>
                      <th className="py-2.5 px-3 text-right">W</th>
                      <th className="py-2.5 px-4 text-right">Econ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {Object.values(activeInnings.bowlers).map((bw) => (
                      <tr key={bw.playerId}>
                        <td className="py-3 px-4 font-bold text-white">{bw.name}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-200">{bw.oversDisplay}</td>
                        <td className="py-3 px-3 text-right text-slate-400">{bw.maidens}</td>
                        <td className="py-3 px-3 text-right font-bold text-white">{bw.runsConceded}</td>
                        <td className="py-3 px-3 text-right font-black text-rose-400">{bw.wickets}</td>
                        <td className="py-3 px-4 text-right text-slate-400 font-mono">{bw.economy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Fall of Wickets */}
            {activeInnings.fallOfWickets.length > 0 && (
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fall of Wickets</span>
                <div className="flex flex-wrap gap-2 text-xs">
                  {activeInnings.fallOfWickets.map((fow) => (
                    <span
                      key={fow.wicketNumber}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300"
                    >
                      <span className="font-bold text-rose-400">
                        {fow.score}-{fow.wicketNumber}
                      </span>{' '}
                      ({fow.dismissedPlayerName}, {fow.overs} ov)
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: BALL BY BALL COMMENTARY */}
        {activeTab === 'COMMENTARY' && (
          <div className="space-y-2.5">
            {currentMatch.ballEvents.length === 0 ? (
              <p className="text-center text-slate-500 py-10">No deliveries bowled yet.</p>
            ) : (
              currentMatch.ballEvents
                .slice()
                .reverse()
                .map((b) => (
                  <div
                    key={b.id}
                    className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-start space-x-3 shadow-md"
                  >
                    <span
                      className={`min-w-[42px] h-9 rounded-lg flex items-center justify-center font-mono text-xs font-bold border ${
                        b.runsOffBat === 4
                          ? 'bg-emerald-600 text-white border-emerald-400'
                          : b.runsOffBat === 6
                          ? 'bg-purple-600 text-white border-purple-400'
                          : b.wicket
                          ? 'bg-rose-600 text-white border-rose-400'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {b.displayOver}
                    </span>
                    <div className="flex-1">
                      <div className="font-bold text-sm text-white">
                        {b.bowlerName} to {b.strikerName}
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{b.commentary}</p>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {/* TAB 4: SHARE & WHATSAPP EXPORT */}
        {activeTab === 'SHARE' && (
          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
              <Share2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="text-lg font-bold text-white">Share Match With Spectators</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Anyone with the link can follow live scores with real-time updates and zero login required.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={handleCopyWhatsAppSummary}
                  className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center space-x-2 text-sm"
                >
                  {copiedSummary ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedSummary ? 'Copied WhatsApp Text!' : 'Copy WhatsApp Summary'}</span>
                </button>

                <button
                  onClick={handleDownloadScorecardImage}
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold rounded-xl border border-slate-700 shadow transition flex items-center justify-center space-x-2 text-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Scorecard Graphic</span>
                </button>
              </div>
            </div>

            {/* Hidden Canvas for Graphic Generation */}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}
      </main>
    </div>
  );
};
