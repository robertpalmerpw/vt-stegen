import React from 'react';
import { Match } from '../types';
import { History, Sparkles } from 'lucide-react';

interface MatchHistoryProps {
  matches: Match[];
}

export const MatchHistory: React.FC<MatchHistoryProps> = ({ matches }) => {
  if (matches.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
        <History className="w-5 h-5 text-slate-500" />
        Senaste Matcherna
      </h3>
      <div className="space-y-4">
        {matches.map((match) => (
          <div key={match.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-800">{match.winnerName}</span>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded">Vinst</span>
              </div>
              <div className="font-mono font-bold text-lg text-slate-700">
                {match.winnerScore} - {match.loserScore}
              </div>
              <div className="flex items-center gap-3 justify-end">
                 <span className="font-medium text-slate-600">{match.loserName}</span>
              </div>
            </div>
            
            <div className="text-xs text-slate-400 flex justify-between items-center mt-2 border-t border-slate-50 pt-2">
               <span>{new Date(match.date).toLocaleString('sv-SE')}</span>
               {match.isRankSwap && (
                 <span className="text-orange-600 font-semibold flex items-center gap-1">
                   Ranking förändrad! ⚡
                 </span>
               )}
            </div>

            {match.aiCommentary && (
              <div className="mt-3 bg-indigo-50 p-3 rounded-md text-sm text-indigo-800 border border-indigo-100 flex gap-2 items-start">
                 <Sparkles className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                 <p className="italic">"{match.aiCommentary}"</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};