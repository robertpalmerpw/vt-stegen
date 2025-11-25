import React, { useState, useMemo } from 'react';
import { Player } from '../types';
import { Button } from './Button';
import { Swords, Trophy } from 'lucide-react';

interface MatchRegistrationProps {
  players: Player[];
  onRegisterMatch: (winnerId: string, loserId: string, winnerScore: number, loserScore: number) => Promise<void>;
  isSubmitting: boolean;
}

export const MatchRegistration: React.FC<MatchRegistrationProps> = ({ players, onRegisterMatch, isSubmitting }) => {
  const [player1Id, setPlayer1Id] = useState<string>('');
  const [player2Id, setPlayer2Id] = useState<string>('');
  const [score1, setScore1] = useState<string>('');
  const [score2, setScore2] = useState<string>('');

  const player1 = players.find(p => p.id === player1Id);
  
  const eligibleOpponents = useMemo(() => {
    if (!player1) return [];
    return players.filter(p => {
      if (p.id === player1.id) return false;
      const rankDiff = Math.abs(player1.rank - p.rank);
      return rankDiff <= 2;
    }).sort((a, b) => a.rank - b.rank);
  }, [player1, players]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!player1Id || !player2Id || !score1 || !score2) return;
    
    const s1 = parseInt(score1);
    const s2 = parseInt(score2);

    if (s1 === s2) {
      alert("Oavgjort är inte tillåtet i den här ligan!");
      return;
    }

    const winnerId = s1 > s2 ? player1Id : player2Id;
    const loserId = s1 > s2 ? player2Id : player1Id;
    const winnerScore = Math.max(s1, s2);
    const loserScore = Math.min(s1, s2);

    await onRegisterMatch(winnerId, loserId, winnerScore, loserScore);
    
    setScore1('');
    setScore2('');
    setPlayer1Id('');
    setPlayer2Id('');
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 sm:p-8 relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
      
      <div className="mb-8 text-center">
        <h2 className="text-xl font-bold text-slate-800 flex items-center justify-center gap-2">
          <Swords className="w-6 h-6 text-emerald-600" />
          Match Center
        </h2>
        <p className="text-sm text-slate-500">Registrera resultatet från matchen</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Player 1 */}
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">Utmanare</label>
            <select
              value={player1Id}
              onChange={(e) => { setPlayer1Id(e.target.value); setPlayer2Id(''); }}
              className="w-full appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-center font-bold rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all cursor-pointer"
              required
            >
              <option value="">Välj spelare</option>
              {players.map(p => (
                <option key={p.id} value={p.id}>{p.name} (#{p.rank})</option>
              ))}
            </select>
          </div>

          <div className="font-black text-2xl text-slate-200 italic">VS</div>

          {/* Player 2 */}
          <div className="flex-1 w-full">
             <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">Motståndare</label>
            <select
              value={player2Id}
              onChange={(e) => setPlayer2Id(e.target.value)}
              disabled={!player1Id}
              className="w-full appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-center font-bold rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              required
            >
              <option value="">{!player1Id ? '-' : 'Välj motståndare'}</option>
              {eligibleOpponents.map(p => (
                <option key={p.id} value={p.id}>{p.name} (#{p.rank})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Scores */}
        <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100/50">
          <div className="flex items-center justify-center gap-8">
            <div className="w-24">
              <input
                type="number"
                min="0"
                value={score1}
                placeholder="0"
                onChange={(e) => setScore1(e.target.value)}
                className="w-full aspect-square text-center text-4xl sm:text-5xl font-black bg-white rounded-2xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-sm placeholder:text-slate-200 text-slate-800"
                required
              />
            </div>
            <span className="text-slate-300 text-4xl font-thin">:</span>
            <div className="w-24">
              <input
                type="number"
                min="0"
                value={score2}
                placeholder="0"
                onChange={(e) => setScore2(e.target.value)}
                className="w-full aspect-square text-center text-4xl sm:text-5xl font-black bg-white rounded-2xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-sm placeholder:text-slate-200 text-slate-800"
                required
              />
            </div>
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full py-4 text-lg font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transform transition-all active:scale-[0.98]"
          disabled={!player1Id || !player2Id || !score1 || !score2}
          isLoading={isSubmitting}
        >
          <Trophy className="w-5 h-5 mr-2" />
          Slutför Match
        </Button>
      </form>
    </div>
  );
};
