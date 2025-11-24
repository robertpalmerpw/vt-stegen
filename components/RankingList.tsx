import React from 'react';
import { Player } from '../types';
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface RankingListProps {
  players: Player[];
  onRemovePlayer: (id: string) => void;
}

export const RankingList: React.FC<RankingListProps> = ({ players, onRemovePlayer }) => {
  const getStreakIcon = (streak: number) => {
    if (streak > 0) return <TrendingUp className="w-4 h-4 text-emerald-500" />;
    if (streak < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          Rankinglista
        </h2>
        <span className="text-sm text-slate-500">{players.length} spelare</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 font-medium">
            <tr>
              <th className="p-4 w-16 text-center">#</th>
              <th className="p-4">Spelare</th>
              <th className="p-4 text-center">Vinster</th>
              <th className="p-4 text-center">Förluster</th>
              <th className="p-4 text-center">Form</th>
              <th className="p-4 text-right">Hantera</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {players.map((player) => (
              <tr key={player.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 text-center font-bold text-slate-700">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto ${
                    player.rank === 1 ? 'bg-yellow-100 text-yellow-700' : 
                    player.rank === 2 ? 'bg-slate-200 text-slate-700' : 
                    player.rank === 3 ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {player.rank}
                  </div>
                </td>
                <td className="p-4 font-medium text-slate-900 text-base">{player.name}</td>
                <td className="p-4 text-center text-emerald-600 font-medium">{player.wins}</td>
                <td className="p-4 text-center text-red-500">{player.losses}</td>
                <td className="p-4">
                  <div className="flex items-center justify-center gap-1" title={`Streak: ${player.streak}`}>
                    {getStreakIcon(player.streak)}
                    <span className="text-xs text-slate-500">{Math.abs(player.streak)}</span>
                  </div>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => {
                      if(window.confirm(`Är du säker på att du vill ta bort ${player.name}?`)) {
                        onRemovePlayer(player.id);
                      }
                    }}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                    title="Ta bort spelare"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
            {players.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  Inga spelare tillganda än. Lägg till en spelare för att börja!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};