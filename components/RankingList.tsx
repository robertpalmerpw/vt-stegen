import React, { useState } from 'react';
import { Player, Match } from '../types';
import { Trophy, TrendingUp, TrendingDown, Minus, Trash2, Medal, ChevronDown, ChevronUp, Swords, Zap } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';

interface RankingListProps {
  players: Player[];
  matches: Match[];
  onRemovePlayer: (id: string) => void;
}

export const RankingList: React.FC<RankingListProps> = ({ players, matches, onRemovePlayer }) => {
  const { isAdmin } = useAdmin();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getStreakIcon = (streak: number) => {
    if (streak > 0) return <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />;
    if (streak < 0) return <TrendingDown className="w-3.5 h-3.5 text-red-500" />;
    return <Minus className="w-3.5 h-3.5 text-slate-300" />;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return (
      <div className="w-8 h-8 rounded-full bg-yellow-100 border border-yellow-200 flex items-center justify-center text-yellow-700 shadow-sm">
        <Trophy className="w-4 h-4" />
      </div>
    );
    if (rank === 2) return (
      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm">
        <Medal className="w-4 h-4" />
      </div>
    );
    if (rank === 3) return (
      <div className="w-8 h-8 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-700 shadow-sm">
        <Medal className="w-4 h-4" />
      </div>
    );
    return (
      <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 font-mono text-sm font-bold">
        {rank}
      </div>
    );
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getPlayerMatches = (playerId: string) => {
    return matches
      .filter(m => m.winnerId === playerId || m.loserId === playerId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getLastMatchDate = (playerId: string) => {
    const playerMatches = getPlayerMatches(playerId);
    if (playerMatches.length === 0) return null;
    return new Date(playerMatches[0].date);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-50 flex justify-between items-end bg-gradient-to-r from-white to-slate-50/50">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-emerald-500" />
            Tabell
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium"></p>
        </div>
      </div>

      <div className="divide-y divide-slate-50">
        {[...players].sort((a, b) => (b.elo || 1200) - (a.elo || 1200)).map((player, index) => {
          const totalGames = player.wins + player.losses;
          const winRate = totalGames > 0 ? Math.round((player.wins / totalGames) * 100) : 0;
          const isExpanded = expandedId === player.id;
          const lastMatchDate = getLastMatchDate(player.id);
          const recentMatches = isExpanded ? getPlayerMatches(player.id).slice(0, 5) : [];

          return (
            <div key={player.id} className="transition-colors group">
              <div 
                onClick={() => toggleExpand(player.id)}
                className={`p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50/80 transition-colors ${isExpanded ? 'bg-slate-50' : ''}`}
              >
                <div className="flex-shrink-0">
                  {getRankBadge(index + 1)}
                </div>
                
                <img 
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=random&color=fff&size=80&font-size=0.4`}
                  alt={player.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm"
                />

                <div className="flex-grow">
                  <h3 className="font-bold text-slate-800 truncate leading-tight flex items-center gap-2">
                    {player.name}
                    {isExpanded ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-md border border-amber-100">
                      <Zap className="w-3 h-3" />
                      <span className="text-[10px] font-bold">{player.elo || 1200}</span>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                      {player.wins}W - {player.losses}L
                    </span>
                    {player.streak !== 0 && (
                      <div className="flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wider">
                        {getStreakIcon(player.streak)}
                        <span className={player.streak > 0 ? 'text-emerald-600' : 'text-red-500'}>
                          {Math.abs(player.streak)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="hidden md:block text-right mr-4">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Senaste match</span>
                  <span className="text-xs text-slate-600 font-medium">
                    {lastMatchDate ? lastMatchDate.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' }) : '-'}
                  </span>
                </div>

                <div className="hidden sm:block w-24">
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-medium">
                    <span>Win Rate</span>
                    <span>{winRate}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${winRate >= 50 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      style={{ width: `${winRate}%` }}
                    ></div>
                  </div>
                </div>

                {isAdmin && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if(window.confirm(`Ta bort ${player.name}? Detta går inte att ångra.`)) {
                        onRemovePlayer(player.id);
                      }
                    }}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Expanded Match History */}
              {isExpanded && (
                <div className="bg-slate-50 px-4 pb-4 pt-0 animate-in slide-in-from-top-2 duration-200">
                  <div className="pl-[4.5rem]">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Swords className="w-3 h-3" />
                      Senaste matcher
                    </div>
                    
                    {recentMatches.length > 0 ? (
                      <div className="space-y-2">
                        {recentMatches.map((match) => {
                          const isWinner = match.winnerId === player.id;
                          const opponentId = isWinner ? match.loserId : match.winnerId;
                          const opponent = players.find(p => p.id === opponentId);
                          const opponentName = opponent ? opponent.name : 'Okänd spelare';
                          
                          // ELO diff (visas om det finns i match-objektet)
                          // Antar att match.eloChange finns
                          const eloDiff = match.eloChange ? (isWinner ? `+${match.eloChange}` : `-${match.eloChange}`) : null;
                          const playerScore = isWinner ? match.winnerScore : match.loserScore;
                          const opponentScore = isWinner ? match.loserScore : match.winnerScore;

                          return (
                            <div key={match.id} className="flex items-center justify-between bg-white border border-slate-100 p-2 rounded-lg text-sm">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${isWinner ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                <span className="text-slate-500 text-xs">
                                  {new Date(match.date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}
                                </span>
                                <span className="font-medium text-slate-700">
                                  vs {opponentName}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                {eloDiff && (
                                  <span className={`text-xs font-bold ${isWinner ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {eloDiff} p
                                  </span>
                                )}
                                <div className="font-mono font-bold text-slate-800">
                                  {playerScore} - {opponentScore}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">Inga spelade matcher än.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {players.length === 0 && (
          <div className="p-12 text-center text-slate-400">
            Inga spelare i ligan än.
          </div>
        )}
      </div>
    </div>
  );
};