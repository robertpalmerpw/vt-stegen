import React from 'react';
import { Match } from '../types';
import { History, Sparkles, TrendingUp, Calendar, Trash2, Zap } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';

interface MatchHistoryProps {
    matches: Match[];
    onRemoveMatch: (id: string) => void;
}

export const MatchHistory: React.FC<MatchHistoryProps> = ({ matches, onRemoveMatch }) => {
    const { isAdmin } = useAdmin();

    if (matches.length === 0) return null;

    const displayMatches = matches
        .filter(m => m.status === 'completed' || !m.status)
        .slice(0, 10);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 px-2">
                <History className="w-5 h-5 text-slate-400" />
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                    Senaste Matcherna
                </h3>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {displayMatches.map((match) => (
                    <div
                        key={match.id}
                        className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all group relative"
                    >
                        {isAdmin && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm('Är du säker på att du vill ta bort denna match?')) {
                                        onRemoveMatch(match.id);
                                    }
                                }}
                                className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors z-10 opacity-0 group-hover:opacity-100"
                                title="Ta bort match"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}

                        <div className="flex">
                            <div className="flex-1 bg-emerald-50/50 p-4 flex flex-col items-start border-r border-slate-100">
                                <div className="flex items-center justify-between w-full mb-1">
                                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Vinnare</span>
                                    {match.eloChange && (
                                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-100/50 px-1.5 py-0.5 rounded-full">
                                            <Zap className="w-2.5 h-2.5" />
                                            +{match.eloChange}
                                        </span>
                                    )}
                                </div>
                                <span className="font-bold text-slate-800 text-lg leading-none">{match.winnerName}</span>
                                <span className="text-3xl font-black text-emerald-600 mt-2">{match.winnerScore}</span>
                            </div>

                            <div className="flex-1 bg-white p-4 flex flex-col items-end">
                                <div className="flex items-center justify-between w-full mb-1">
                                    {match.eloChange && (
                                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-red-400 bg-red-50 px-1.5 py-0.5 rounded-full">
                                            <Zap className="w-2.5 h-2.5" />
                                            -{match.eloChange}
                                        </span>
                                    )}
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Förlorare</span>
                                </div>
                                <span className="font-medium text-slate-600 text-lg leading-none">{match.loserName}</span>
                                <span className="text-3xl font-bold text-slate-300 mt-2">{match.loserScore}</span>
                            </div>
                        </div>

                        <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1.5 text-slate-400">
                                    <Calendar className="w-3 h-3" />
                                    <span className="text-xs font-medium">
                                        {new Date(match.date).toLocaleDateString('sv-SE', {
                                            weekday: 'short',
                                            day: 'numeric',
                                            month: 'short',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                            </div>

                            {match.aiCommentary && (
                                <div className="flex gap-2 items-start mt-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-400 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-slate-500 italic leading-relaxed">
                                        {match.aiCommentary}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
