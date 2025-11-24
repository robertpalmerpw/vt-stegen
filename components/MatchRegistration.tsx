import React, { useState, useMemo } from 'react';
import { Player } from '../types';
import { Button } from './Button';
import { Swords } from 'lucide-react';

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
  
  // Filter eligible opponents: Must be within +/- 2 ranks
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
    
    // Reset form
    setScore1('');
    setScore2('');
    setPlayer1Id('');
    setPlayer2Id('');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
        <Swords className="w-5 h-5 text-emerald-600" />
        Registrera Match
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Spelare 1 (Utmanare)</label>
            <select
              value={player1Id}
              onChange={(e) => {
                setPlayer1Id(e.target.value);
                setPlayer2Id(''); // Reset P2 when P1 changes
              }}
              className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              required
            >
              <option value="">Välj spelare...</option>
              {players.map(p => (
                <option key={p.id} value={p.id}>{p.rank}. {p.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Spelare 2 (Motståndare)</label>
            <select
              value={player2Id}
              onChange={(e) => setPlayer2Id(e.target.value)}
              disabled={!player1Id}
              className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none disabled:bg-slate-100 disabled:text-slate-400"
              required
            >
              <option value="">
                {!player1Id ? 'Välj spelare 1 först' : 'Välj motståndare...'}
              </option>
              {eligibleOpponents.map(p => (
                <option key={p.id} value={p.id}>{p.rank}. {p.name}</option>
              ))}
            </select>
            {player1Id && eligibleOpponents.length === 0 && (
              <p className="text-xs text-red-500 mt-1">Inga spelare inom +/- 2 ranker.</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 bg-slate-50 p-4 rounded-lg">
          <div className="text-center">
             <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Poäng P1</label>
             <input
               type="number"
               min="0"
               value={score1}
               onChange={(e) => setScore1(e.target.value)}
               className="w-20 h-12 text-center text-xl font-bold rounded-md border-slate-300 border focus:border-emerald-500 focus:ring-emerald-500"
               required
             />
          </div>
          <span className="text-slate-300 text-2xl font-light">-</span>
          <div className="text-center">
             <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Poäng P2</label>
             <input
               type="number"
               min="0"
               value={score2}
               onChange={(e) => setScore2(e.target.value)}
               className="w-20 h-12 text-center text-xl font-bold rounded-md border-slate-300 border focus:border-emerald-500 focus:ring-emerald-500"
               required
             />
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          disabled={!player1Id || !player2Id || !score1 || !score2}
          isLoading={isSubmitting}
        >
          Registrera Resultat
        </Button>
      </form>
    </div>
  );
};