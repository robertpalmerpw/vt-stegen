import React, { useState, useMemo } from 'react';
import { Player } from '../types';
import { Button } from './Button';
import { Swords, Trophy, AlertCircle, Ban, CheckCircle2 } from 'lucide-react';

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
    
    // Filtrera motståndare: Max 2 placeringar skillnad i rank
    return players
      .filter(p => {
        if (p.id === player1.id) return false;
        const rankDiff = Math.abs(p.rank - player1.rank);
        return rankDiff <= 2;
      })
      .sort((a, b) => a.rank - b.rank);
  }, [player1, players]);

  const handleScoreChange = (value: string, setter: (val: string) => void) => {
    if (value === '') {
      setter('');
      return;
    }
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 0 && num <= 2) {
      setter(value);
    }
  };

  const matchStatus = useMemo(() => {
    if (score1 === '' || score2 === '') return { isValid: false, error: null };

    const s1 = parseInt(score1, 10);
    const s2 = parseInt(score2, 10);

    if (s1 === 2 && s2 === 2) {
      return {
        isValid: false,
        error: '2-2 är inte möjligt i bäst av 3.'
      };
    }

    if (s1 < 2 && s2 < 2) {
      return {
        isValid: false,
        error: null
      };
    }

    if (s1 === 2 || s2 === 2) {
      return {
        isValid: true,
        error: null
      };
    }

    return { isValid: false, error: null };
  }, [score1, score2]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!matchStatus.isValid || !player1Id || !player2Id) return;

    const s1 = parseInt(score1, 10);
    const s2 = parseInt(score2, 10);

    const winnerScore = Math.max(s1, s2);
    const loserScore = Math.min(s1, s2);
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
        <p className="text-sm text-slate-500">Registrera antal vunna set (Bäst av 3).</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
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
                <option key={p.id} value={p.id}>{p.name} (Rank {p.rank})</option>
              ))}
            </select>
          </div>

          <div className="font-black text-2xl text-slate-200 italic">VS</div>

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
                <option key={p.id} value={p.id}>{p.name} (Rank {p.rank})</option>
              ))}
            </select>
            {player1Id && eligibleOpponents.length === 0 && (
              <p className="text-xs text-center text-amber-500 mt-2 font-medium">
                Inga spelare inom 2 placeringar.
              </p>
            )}
          </div>
        </div>

        <div className={`bg-slate-50/50 rounded-2xl p-6 border transition-colors duration-300 ${matchStatus.error ? 'border-red-200 bg-red-50/30' : matchStatus.isValid ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-100/50'}`}>
          <div className="text-center mb-4">
            <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full transition-colors ${
              matchStatus.error ? 'bg-red-100 text-red-600' :
              matchStatus.isValid ? 'bg-emerald-100 text-emerald-600' :
              'bg-slate-200 text-slate-500'
            }`}>
              {matchStatus.error ? 'Ogiltigt' : matchStatus.isValid ? 'Giltigt Resultat' : 'Resultat (Bäst av 3 set)'}
            </span>
          </div>

          <div className="flex items-center justify-center gap-8">
            <div className="w-24">
              <input
                type="number"
                min="0"
                max="2"
                value={score1}
                placeholder="-"
                onChange={(e) => handleScoreChange(e.target.value, setScore1)}
                className={`w-full aspect-square text-center text-4xl sm:text-5xl font-black bg-white rounded-2xl border-2 outline-none transition-all shadow-sm placeholder:text-slate-200 text-slate-800 ${
                  matchStatus.error ? 'border-red-300 focus:border-red-500' :
                  matchStatus.isValid ? 'border-emerald-400 focus:border-emerald-500 ring-4 ring-emerald-500/10' :
                  'border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
                }`}
                required
              />
            </div>
            <span className="text-slate-300 text-4xl font-thin">:</span>
            <div className="w-24">
              <input
                type="number"
                min="0"
                max="2"
                value={score2}
                placeholder="-"
                onChange={(e) => handleScoreChange(e.target.value, setScore2)}
                className={`w-full aspect-square text-center text-4xl sm:text-5xl font-black bg-white rounded-2xl border-2 outline-none transition-all shadow-sm placeholder:text-slate-200 text-slate-800 ${
                  matchStatus.error ? 'border-red-300 focus:border-red-500' :
                  matchStatus.isValid ? 'border-emerald-400 focus:border-emerald-500 ring-4 ring-emerald-500/10' :
                  'border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
                }`}
                required
              />
            </div>
          </div>

          <div className="text-center mt-4 flex items-center justify-center min-h-[24px]">
            {matchStatus.error ? (
              <div className="flex items-center gap-2 text-red-500 animate-in fade-in slide-in-from-bottom-1 duration-300">
                <Ban className="w-4 h-4" />
                <p className="text-xs font-bold">{matchStatus.error}</p>
              </div>
            ) : matchStatus.isValid ? (
              <div className="flex items-center gap-2 text-emerald-600 animate-in fade-in slide-in-from-bottom-1 duration-300">
                <CheckCircle2 className="w-4 h-4" />
                <p className="text-xs font-bold">Redo att registrera!</p>
              </div>
            ) : (
              <div className="flex items-start gap-2 opacity-60">
                <AlertCircle className="w-4 h-4 text-slate-400 mt-0.5" />
                <p className="text-xs text-slate-500">Först till 2 set vinner.</p>
              </div>
            )}
          </div>
        </div>

        <Button
          type="submit"
          className={`w-full py-4 text-lg font-bold shadow-lg transform transition-all active:scale-[0.98] ${
            !matchStatus.isValid || !player1Id || !player2Id
              ? 'opacity-50 cursor-not-allowed bg-slate-300 shadow-none'
              : 'shadow-emerald-500/20 hover:shadow-emerald-500/30'
          }`}
          disabled={!matchStatus.isValid || !player1Id || !player2Id}
          isLoading={isSubmitting}
        >
          <Trophy className="w-5 h-5 mr-2" />
          Registrera Resultat
        </Button>
      </form>
    </div>
  );
};