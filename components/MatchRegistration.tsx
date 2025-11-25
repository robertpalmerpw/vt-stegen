import React, { useState, useMemo } from 'react';
import { Player } from '../types';
import { Button } from './Button';
import { Swords, Trophy, AlertCircle } from 'lucide-react';

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
  
  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => a.rank - b.rank);
  }, [players]);

  const eligibleOpponents = useMemo(() => {
    if (!player1) return [];
    return players.filter(p => {
      if (p.id === player1.id) return false;
      const rankDiff = Math.abs(player1.rank - p.rank);
      return rankDiff <= 2;
    }).sort((a, b) => a.rank - b.rank);
  }, [player1, players]);

  // Hjälpfunktion för att strikt bara tillåta 0-3
  const handleScoreChange = (value: string, setter: (val: string) => void) => {
    // Tillåt tom sträng (för att kunna sudda)
    if (value === '') {
      setter('');
      return;
    }
    
    const num = parseInt(value, 10);
    
    // Uppdatera bara om det är ett nummer och ligger mellan 0 och 3
    if (!isNaN(num) && num >= 0 && num <= 3) {
      setter(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!player1Id || !player2Id || score1 === '' || score2 === '') return;
    
    const s1 = parseInt(score1, 10);
    const s2 = parseInt(score2, 10);

    if (isNaN(s1) || isNaN(s2)) return;

    // Logik: Vinnaren måste ha 2 (Bäst av 3) eller 3 (Bäst av 5)
    // och vinnaren måste ha fler set än förloraren.
    const winnerScore = Math.max(s1, s2);
    const loserScore = Math.min(s1, s2);
    
    // Kontrollera att det är ett giltigt slutresultat (t.ex. 2-0, 2-1, 3-0, 3-1, 3-2)
    // Vi tillåter nu även 3 eftersom inputfältet tillåter det.
    const isValidResult = (winnerScore === 2 || winnerScore === 3) && winnerScore > loserScore;

    if (!isValidResult) {
      alert("Ogiltigt resultat! Vinnaren måste ha antingen 2 eller 3 vunna set, och fler än förloraren.");
      return;
    }

    const winnerId = s1 > s2 ? player1Id : player2Id;
    const loserId = s1 > s2 ? player2Id : player1Id;

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
        <p className="text-sm text-slate-500">Registrera antal vunna set.</p>
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
              {sortedPlayers.map(p => (
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
          <div className="text-center mb-4">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest bg-emerald-100 px-3 py-1 rounded-full">
              Resultat (Set)
            </span>
          </div>
          
          <div className="flex items-center justify-center gap-8">
            <div className="w-24">
              <label className="block text-[10px] font-bold text-slate-400 uppercase text-center mb-1">Set</label>
              <input
                type="number"
                min="0"
                max="2"
                value={score1}
                placeholder="-"
                onChange={(e) => handleScoreChange(e.target.value, setScore1)}
                className="w-full aspect-square text-center text-4xl sm:text-5xl font-black bg-white rounded-2xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-sm placeholder:text-slate-200 text-slate-800"
                required
              />
            </div>
            <span className="text-slate-300 text-4xl font-thin pt-4">:</span>
            <div className="w-24">
              <label className="block text-[10px] font-bold text-slate-400 uppercase text-center mb-1">Set</label>
              <input
                type="number"
                min="0"
                max="2"
                value={score2}
                placeholder="-"
                onChange={(e) => handleScoreChange(e.target.value, setScore2)}
                className="w-full aspect-square text-center text-4xl sm:text-5xl font-black bg-white rounded-2xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-sm placeholder:text-slate-200 text-slate-800"
                required
              />
            </div>
          </div>
          
          <div className="text-center mt-4 flex items-start justify-center gap-2 opacity-60">
            <AlertCircle className="w-4 h-4 text-slate-400 mt-0.5" />
            <p className="text-xs text-slate-500 max-w-[200px] leading-tight">
              Ange slutresultatet i set.<br/>
              Godkända resultat t.ex. 2-0 eller 2-1.
            </p>
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full py-4 text-lg font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transform transition-all active:scale-[0.98]"
          disabled={!player1Id || !player2Id || score1 === '' || score2 === ''}
          isLoading={isSubmitting}
        >
          <Trophy className="w-5 h-5 mr-2" />
          Registrera Resultat
        </Button>
      </form>
    </div>
  );
};