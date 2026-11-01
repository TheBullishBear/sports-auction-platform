import React, { useState } from 'react';
import {
  Trophy,
  Calendar,
  Flame,
  PlusCircle,
  Play,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  Download,
  Users,
} from 'lucide-react';
import { useCricket } from '../context/CricketContext';
import { Tournament, TournamentTeam, MatchFixture } from '../cricketTypes';

interface TournamentHubProps {
  onNavigateToScorer: (matchId: string) => void;
  onNavigateToMatch: (matchId: string) => void;
}

export const TournamentHub: React.FC<TournamentHubProps> = ({ onNavigateToScorer, onNavigateToMatch }) => {
  const { tournaments, currentTournament, standings, selectTournament, selectMatch, createTournament } =
    useCricket();

  const [activeTab, setActiveTab] = useState<'STANDINGS' | 'FIXTURES' | 'CAPS' | 'CREATE'>('STANDINGS');

  // Create tournament wizard state
  const [tournName, setTournName] = useState<string>('');
  const [tournSeason, setTournSeason] = useState<string>('Season 1');
  const [tournOvers, setTournOvers] = useState<number>(5);
  const [tournMaxBowlerOvers, setTournMaxBowlerOvers] = useState<number>(2);
  const [isImportingFromAuction, setIsImportingFromAuction] = useState<boolean>(false);

  if (!currentTournament) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 text-slate-400">
        <Trophy className="w-12 h-12 text-amber-500 animate-bounce mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Loading Tournaments...</h2>
      </div>
    );
  }

  // Import teams from Auction database
  const handleImportFromAuction = async () => {
    setIsImportingFromAuction(true);
    try {
      const [teamsRes, playersRes] = await Promise.all([
        fetch('/api/teams'),
        fetch('/api/players'),
      ]);

      if (teamsRes.ok && playersRes.ok) {
        const teamsData = await teamsRes.json();
        const playersData = await playersRes.json();

        const newTeams: TournamentTeam[] = teamsData.map((t: any) => {
          const teamRoster = playersData
            .filter((p: any) => p.winningTeamId === t.id)
            .map((p: any) => ({
              id: p.id,
              name: p.name,
              role: p.role,
              avatarUrl: p.avatarUrl,
            }));

          return {
            id: `tourn-${t.id}`,
            name: t.name,
            shortCode: t.code,
            color: '#0284c7',
            logoUrl: t.logo,
            players: teamRoster.length > 0 ? teamRoster : [
              { id: `p-${t.id}-1`, name: `${t.code} Player 1`, role: 'Batter' },
              { id: `p-${t.id}-2`, name: `${t.code} Player 2`, role: 'All-Rounder' },
              { id: `p-${t.id}-3`, name: `${t.code} Player 3`, role: 'Bowler' },
            ],
          };
        });

        const newTournament: Tournament = {
          id: `tourn-${Date.now()}`,
          name: tournName.trim() || 'Premier Auction Cricket League',
          season: tournSeason.trim() || '2026',
          format: 'LEAGUE',
          totalOvers: tournOvers,
          maxOversPerBowler: tournMaxBowlerOvers,
          ballType: 'TENNIS_HARD',
          teams: newTeams,
          fixtures: [],
          createdAt: Date.now(),
        };

        // Generate round-robin fixtures if at least 2 teams
        if (newTeams.length >= 2) {
          const generatedFixtures: MatchFixture[] = [];
          let matchNum = 1;
          for (let i = 0; i < newTeams.length; i++) {
            for (let j = i + 1; j < newTeams.length; j++) {
              generatedFixtures.push({
                id: `match-gen-${Date.now()}-${matchNum}`,
                tournamentId: newTournament.id,
                matchNumber: matchNum,
                title: `Match ${matchNum} - ${newTeams[i].name} vs ${newTeams[j].name}`,
                teamAId: newTeams[i].id,
                teamBId: newTeams[j].id,
                venue: 'Wankhede Community Stadium, Mumbai',
                dateTime: `Matchday ${matchNum}, 07:00 PM IST`,
                rules: {
                  totalOvers: tournOvers,
                  maxOversPerBowler: tournMaxBowlerOvers,
                  wideValue: 1,
                  noBallValue: 1,
                  freeHitOnNoBall: true,
                },
                status: 'UPCOMING',
                currentInningsNumber: 1,
                ballEvents: [],
                scorerPin: '1234',
              });
              matchNum++;
            }
          }
          newTournament.fixtures = generatedFixtures;
        }

        await createTournament(newTournament);
        setActiveTab('STANDINGS');
      }
    } catch (e) {
      console.error('Failed to import auction teams:', e);
    } finally {
      setIsImportingFromAuction(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Top Banner */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-5 shadow-lg">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-amber-400">
              <Trophy className="w-4 h-4" />
              <span>Cricket Tournament Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">{currentTournament.name}</h1>
            <p className="text-xs text-slate-400 mt-1">
              Format: {currentTournament.format} • {currentTournament.totalOvers} Overs per Innings •{' '}
              {currentTournament.teams.length} Teams
            </p>
          </div>

          {/* Tournament Switcher */}
          {tournaments.length > 1 && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400">Switch:</span>
              <select
                value={currentTournament.id}
                onChange={(e) => selectTournament(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white text-xs font-bold rounded-lg px-3 py-2"
              >
                {tournaments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 space-x-2">
          {(['STANDINGS', 'FIXTURES', 'CAPS', 'CREATE'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-3 text-sm font-bold border-b-2 transition ${
                activeTab === tab
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab === 'STANDINGS'
                ? 'Points Table'
                : tab === 'FIXTURES'
                ? 'Fixtures & Results'
                : tab === 'CAPS'
                ? 'Caps & Stats'
                : 'Tournament Setup'}
            </button>
          ))}
        </div>

        {/* TAB 1: POINTS TABLE */}
        {activeTab === 'STANDINGS' && (
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
            <div className="px-5 py-4 bg-slate-800/80 border-b border-slate-700 font-bold text-base text-white flex justify-between items-center">
              <span>Points Table (ICC NRR Model)</span>
              <span className="text-xs font-normal text-slate-400">Win: 2 pts • Tie/NR: 1 pt</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-800/40 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Team</th>
                    <th className="py-3 px-3 text-center">P</th>
                    <th className="py-3 px-3 text-center">W</th>
                    <th className="py-3 px-3 text-center">L</th>
                    <th className="py-3 px-3 text-center">T/NR</th>
                    <th className="py-3 px-3 text-center font-bold text-white">PTS</th>
                    <th className="py-3 px-4 text-right">NRR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {(standings?.pointsTable || []).map((row, idx) => (
                    <tr key={row.teamId} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-400">
                        <span
                          className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-black ${
                            idx === 0
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                              : idx === 1
                              ? 'bg-slate-700 text-slate-200'
                              : 'text-slate-500'
                          }`}
                        >
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white flex items-center space-x-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ backgroundColor: row.color }}
                        ></span>
                        <span>{row.teamName}</span>
                      </td>
                      <td className="py-3.5 px-3 text-center text-slate-300">{row.played}</td>
                      <td className="py-3.5 px-3 text-center text-emerald-400 font-bold">{row.won}</td>
                      <td className="py-3.5 px-3 text-center text-rose-400 font-bold">{row.lost}</td>
                      <td className="py-3.5 px-3 text-center text-slate-400">{row.tied + row.noResult}</td>
                      <td className="py-3.5 px-3 text-center font-black text-amber-400 text-base">{row.points}</td>
                      <td
                        className={`py-3.5 px-4 text-right font-mono font-bold ${
                          row.netRunRate > 0
                            ? 'text-emerald-400'
                            : row.netRunRate < 0
                            ? 'text-rose-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {row.netRunRate > 0 ? `+${row.netRunRate.toFixed(3)}` : row.netRunRate.toFixed(3)}
                      </td>
                    </tr>
                  ))}
                  {(!standings || standings.pointsTable.length === 0) && (
                    <tr>
                      <td colSpan={8} className="text-center text-slate-500 py-8">
                        No matches completed yet. Points table updates live once matches finish.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: FIXTURES & RESULTS */}
        {activeTab === 'FIXTURES' && (
          <div className="space-y-4">
            {currentTournament.fixtures.map((fixture) => {
              const team1 = currentTournament.teams.find((t) => t.id === fixture.teamAId);
              const team2 = currentTournament.teams.find((t) => t.id === fixture.teamBId);

              const isLive = fixture.status === 'LIVE' || fixture.status === 'INNINGS_BREAK';
              const isDone = fixture.status === 'COMPLETED';

              return (
                <div
                  key={fixture.id}
                  className={`p-5 rounded-2xl border transition shadow-lg ${
                    isLive
                      ? 'bg-slate-900 border-rose-500/50 shadow-rose-950/20'
                      : 'bg-slate-900/80 border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-center text-xs text-slate-400 pb-3 border-b border-slate-800">
                    <span className="font-semibold">{fixture.venue}</span>
                    <div className="flex items-center space-x-2">
                      {isLive && (
                        <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30 text-xs animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                          <span>LIVE</span>
                        </span>
                      )}
                      {isDone && (
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold text-xs">
                          Finished
                        </span>
                      )}
                      <span>{fixture.dateTime}</span>
                    </div>
                  </div>

                  {/* Team vs Team Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 items-center">
                    {/* Team 1 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full inline-block"
                          style={{ backgroundColor: team1?.color || '#0284c7' }}
                        ></span>
                        <span className="font-bold text-white text-base">{team1?.name}</span>
                      </div>
                      {fixture.firstInnings && fixture.firstInnings.battingTeamId === team1?.id && (
                        <span className="font-mono text-base font-black text-white">
                          {fixture.firstInnings.totalRuns}/{fixture.firstInnings.wickets}{' '}
                          <span className="text-xs text-slate-400 font-normal">({fixture.firstInnings.oversDisplay} ov)</span>
                        </span>
                      )}
                    </div>

                    {/* Team 2 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full inline-block"
                          style={{ backgroundColor: team2?.color || '#eab308' }}
                        ></span>
                        <span className="font-bold text-white text-base">{team2?.name}</span>
                      </div>
                      {fixture.secondInnings && fixture.secondInnings.battingTeamId === team2?.id && (
                        <span className="font-mono text-base font-black text-white">
                          {fixture.secondInnings.totalRuns}/{fixture.secondInnings.wickets}{' '}
                          <span className="text-xs text-slate-400 font-normal">({fixture.secondInnings.oversDisplay} ov)</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Match Result or Margin */}
                  {fixture.result && (
                    <div className="text-xs font-bold text-amber-400 pt-2 border-t border-slate-800/60">
                      🏆 {fixture.result.margin}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800/80 mt-2">
                    <button
                      onClick={() => {
                        selectMatch(fixture.id);
                        onNavigateToMatch(fixture.id);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center space-x-1.5 transition"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                      <span>Spectator View</span>
                    </button>

                    <button
                      onClick={() => {
                        selectMatch(fixture.id);
                        onNavigateToScorer(fixture.id);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow transition"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Live Scoring Desk</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: CAPS & LEADERBOARDS */}
        {activeTab === 'CAPS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Orange Cap (Most Runs) */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
                <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <Flame className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-black text-base text-white">Orange Cap (Most Runs)</h3>
                  <p className="text-xs text-slate-400">Leading run-scorers in the tournament</p>
                </div>
              </div>

              <div className="space-y-2">
                {(standings?.topBatters || []).map((b, idx) => (
                  <div
                    key={b.id}
                    className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex justify-between items-center"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-sm font-bold text-amber-400">#{idx + 1}</span>
                      <div>
                        <div className="font-bold text-sm text-white">{b.name}</div>
                        <div className="text-xs text-slate-400">
                          {b.teamCode} • {b.sixes} Sixes • SR: {b.strikeRate}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-amber-400">{b.runs}</div>
                      <div className="text-xs text-slate-400">Runs</div>
                    </div>
                  </div>
                ))}
                {(!standings?.topBatters || standings.topBatters.length === 0) && (
                  <p className="text-xs text-slate-500 text-center py-4">Stats appear after match deliveries.</p>
                )}
              </div>
            </div>

            {/* Purple Cap (Most Wickets) */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
                <span className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                  <Trophy className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-black text-base text-white">Purple Cap (Most Wickets)</h3>
                  <p className="text-xs text-slate-400">Leading wicket-takers in the tournament</p>
                </div>
              </div>

              <div className="space-y-2">
                {(standings?.topBowlers || []).map((bw, idx) => (
                  <div
                    key={bw.id}
                    className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex justify-between items-center"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-sm font-bold text-purple-400">#{idx + 1}</span>
                      <div>
                        <div className="font-bold text-sm text-white">{bw.name}</div>
                        <div className="text-xs text-slate-400">
                          {bw.teamCode} • Economy: {bw.economy}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-purple-400">{bw.wickets}</div>
                      <div className="text-xs text-slate-400">Wickets</div>
                    </div>
                  </div>
                ))}
                {(!standings?.topBowlers || standings.topBowlers.length === 0) && (
                  <p className="text-xs text-slate-500 text-center py-4">Stats appear after match deliveries.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CREATE TOURNAMENT & IMPORT */}
        {activeTab === 'CREATE' && (
          <div className="max-w-xl mx-auto p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                <PlusCircle className="w-5 h-5 text-amber-400" />
                <span>Create New Tournament</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Configure your tournament and automatically generate round-robin fixtures.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Tournament Name</label>
                <input
                  type="text"
                  placeholder="e.g. Mumbai Box Cricket Premier League 2026"
                  value={tournName}
                  onChange={(e) => setTournName(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium text-sm focus:border-amber-400 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Overs per Innings</label>
                  <select
                    value={tournOvers}
                    onChange={(e) => setTournOvers(Number(e.target.value))}
                    className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium text-sm"
                  >
                    <option value={5}>5 Overs (Blitz T5)</option>
                    <option value={6}>6 Overs</option>
                    <option value={8}>8 Overs</option>
                    <option value={10}>10 Overs (T10)</option>
                    <option value={15}>15 Overs</option>
                    <option value={20}>20 Overs (T20)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Max Overs / Bowler</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={tournMaxBowlerOvers}
                    onChange={(e) => setTournMaxBowlerOvers(Number(e.target.value))}
                    className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium text-sm"
                  />
                </div>
              </div>
            </div>

            {/* 1-Click Import from Auction */}
            <div className="pt-2 border-t border-slate-800 space-y-3">
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-emerald-500/10 border border-amber-500/30">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                  Auction Software Integration
                </span>
                <p className="text-xs text-slate-300 mt-1">
                  1-Click import all teams and acquired players directly from your completed Auction database into this tournament!
                </p>

                <button
                  disabled={isImportingFromAuction}
                  onClick={handleImportFromAuction}
                  className="mt-3 w-full py-3 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-600 hover:to-emerald-600 text-slate-950 font-black rounded-xl shadow-lg transition flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 fill-black" />
                  <span>
                    {isImportingFromAuction
                      ? 'Importing Rosters from Auction...'
                      : 'Import Auction Rosters & Generate Fixtures'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
