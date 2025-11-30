import React, { useState } from 'react';
import { Match, Player } from '../types';
import { Calendar, Clock, Swords, CheckCircle2, Trash2 } from 'lucide-react';
import { registerMatchResult } from '../services/database';
import { playRegisterSound } from '../services/sound';

interface UpcomingMatchesProps {
    matches: Match[];
    players: Player[];
    onMatchCompleted: () => void;
    onRemoveMatch: (id: string) => void;
}

export const UpcomingMatches: React.FC<UpcomingMatchesProps> = ({ matches, players, onMatchCompleted, onRemoveMatch }) => {
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
    const [winnerScore, setWinnerScore] = useState<string>('');
    const [loserScore, setLoserScore] = useState<string>('');
    const [winnerId, setWinnerId] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const scheduledMatches = matches
        .filter(m => m.status === 'scheduled')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (scheduledMatches.length === 0) return null;

    const handleRegisterResult = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMatch || !winnerId || !winnerScore || !loserScore) return;

        setIsSubmitting(true);
        try {
            const loserId = selectedMatch.player1Id === winnerId ? selectedMatch.player2Id : selectedMatch.player1Id;

            if (!loserId) throw new Error("Could not determine loser ID");

            await registerMatchResult(selectedMatch.id, {
                winnerId,
                loserId,
                winnerScore: parseInt(winnerScore),
                loserScore: parseInt(loserScore)
            });

            playRegisterSound();
            onMatchCompleted();
            setSelectedMatch(null);
            setWinnerScore('');
            setLoserScore('');
            setWinnerId('');
        } catch (error) {
            console.error("Failed to register result:", error);
            alert("Kunde inte registrera resultat.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                Kommande matcher
            </h3>

            <div className="grid gap-3">
                {scheduledMatches.map(match => {
                    const isSelected = selectedMatch?.id === match.id;
                    const date = new Date(match.date);
                    const isToday = new Date().toDateString() === date.toDateString();

                    return (
                        <div key={match.id} className={`bg-white border rounded-xl overflow-hidden transition-all relative group ${isSelected ? 'ring-2 ring-emerald-500 border-transparent shadow-lg' : 'border-slate-100 hover:border-emerald-200'}`}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm('Vill du ta bort bokningen?')) {
                                        onRemoveMatch(match.id);
                                    }
                                }}
                                className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors z-10 opacity-0 group-hover:opacity-100"
                                title="Ta bort bokning"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>

                            <div
                                className="p-4 cursor-pointer"
                                onClick={() => setSelectedMatch(isSelected ? null : match)}
                            >
                                <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {date.toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' })}
                                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                        <Clock className="w-3.5 h-3.5" />
                                        {date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    {isToday && (
                                        <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide mr-6">
                                            Idag
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1 text-right font-bold text-slate-800 truncate">
                                        {match.player1Name}
                                    </div>
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 text-slate-400">
                                        <Swords className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 text-left font-bold text-slate-800 truncate">
                                        {match.player2Name}
                                    </div>
                                </div>
                            </div>

                            {isSelected && (
                                <div className="bg-slate-50 p-4 border-t border-slate-100 animate-in slide-in-from-top-2">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registrera resultat</h4>
                                        <span className="text-xs text-slate-400 font-medium">🏓 Bäst av 3 set</span>
                                    </div>
                                    <form onSubmit={handleRegisterResult} className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">Vem vann?</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setWinnerId(match.player1Id || '')}
                                                    className={`p-3 rounded-lg border text-sm font-bold transition-all ${winnerId === match.player1Id ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'}`}
                                                >
                                                    {match.player1Name}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setWinnerId(match.player2Id || '')}
                                                    className={`p-3 rounded-lg border text-sm font-bold transition-all ${winnerId === match.player2Id ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'}`}
                                                >
                                                    {match.player2Name}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-slate-500">Vunna set (vinnare)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="2"
                                                    value={winnerScore}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val === '' || (parseInt(val) >= 0 && parseInt(val) <= 2)) {
                                                            setWinnerScore(val);
                                                        }
                                                    }}
                                                    className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-center font-mono font-bold text-lg"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-slate-500">Vunna set (förlorare)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="1"
                                                    value={loserScore}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val === '' || (parseInt(val) >= 0 && parseInt(val) <= 1)) {
                                                            setLoserScore(val);
                                                        }
                                                    }}
                                                    className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-center font-mono font-bold text-lg"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isSubmitting || !winnerId}
                                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {isSubmitting ? 'Sparar...' : (
                                                <>
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Spara resultat
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
