
import React, { useState, useEffect } from 'react';
import { Player, Match } from '../types';
import { X, Calendar, Clock, Swords, ChevronLeft, ChevronRight } from 'lucide-react';
import { scheduleMatch } from '../services/database';
import { playChallengeSound } from '../services/sound';

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    challenger: Player | null;
    players: Player[];
    matches: Match[];
    onMatchScheduled: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, challenger, players, matches, onMatchScheduled }) => {
    const [opponentId, setOpponentId] = useState<string>('');
    const [date, setDate] = useState<Date>(new Date());
    const [time, setTime] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setDate(new Date());
            setTime('');
            setOpponentId('');
        }
    }, [isOpen]);

    if (!isOpen || !challenger) return null;

    // Filter out challenger and apply rank restriction (+/- 5 ranks)
    const availableOpponents = players.filter(p => {
        if (p.id === challenger.id) return false;

        // If ranks are missing, allow all (fallback)
        if (!p.rank || !challenger.rank) return true;

        const rankDiff = Math.abs(p.rank - challenger.rank);
        return rankDiff <= 5;
    });

    const timeSlots = [];
    for (let hour = 8; hour <= 20; hour++) {
        const hourStr = hour.toString().padStart(2, '0');
        timeSlots.push(`${hourStr}:00`);
        if (hour < 20) {
            timeSlots.push(`${hourStr}:30`);
        }
    }

    const changeDate = (days: number) => {
        const newDate = new Date(date);
        newDate.setDate(date.getDate() + days);
        setDate(newDate);
    };

    const getDisplayDate = (d: Date) => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (d.toDateString() === today.toDateString()) return "Idag";
        if (d.toDateString() === tomorrow.toDateString()) return "Imorgon";

        return d.toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' });
    };

    const isTimeSlotBooked = (timeSlot: string) => {
        const dateStr = date.toISOString().split('T')[0];
        const slotDateTime = new Date(`${dateStr}T${timeSlot}`);

        return matches.some(match => {
            if (match.status !== 'scheduled') return false;
            const matchDate = new Date(match.date);
            return matchDate.getTime() === slotDateTime.getTime();
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!opponentId || !time) return;

        setIsSubmitting(true);
        try {
            // Combine date and time
            const dateStr = date.toISOString().split('T')[0];
            const scheduledDate = new Date(`${dateStr}T${time}`);

            await scheduleMatch(challenger.id, opponentId, scheduledDate);
            playChallengeSound();
            onMatchScheduled();
            onClose();
        } catch (error) {
            console.error("Failed to schedule match:", error);
            alert("Kunde inte boka match.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-gradient-to-r from-emerald-50 to-white flex-shrink-0">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Swords className="w-5 h-5 text-emerald-600" />
                        Boka match
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-y-auto p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Utmanare</span>
                            <div className="font-bold text-slate-800 text-lg">{challenger.name}</div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Välj motståndare</label>
                            <select
                                value={opponentId}
                                onChange={(e) => setOpponentId(e.target.value)}
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                required
                            >
                                <option value="">Välj spelare...</option>
                                {availableOpponents.map(player => (
                                    <option key={player.id} value={player.id}>
                                        {player.name} (Rank #{player.rank})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                Datum
                            </label>
                            <div className="flex items-center justify-between bg-slate-50 rounded-xl p-2 border border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => changeDate(-1)}
                                    className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-500"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="font-bold text-slate-700 capitalize">
                                    {getDisplayDate(date)}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => changeDate(1)}
                                    className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-500"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-slate-400" />
                                Tid
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {timeSlots.map(slot => {
                                    const isBooked = isTimeSlotBooked(slot);
                                    return (
                                        <button
                                            key={slot}
                                            type="button"
                                            onClick={() => setTime(slot)}
                                            disabled={isBooked}
                                            className={`py-2 px-1 text-sm font-bold rounded-lg border transition-all ${isBooked
                                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50'
                                                : time === slot
                                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                                                    : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50'
                                                }`}
                                            title={isBooked ? 'Redan bokad' : ''}
                                        >
                                            {slot}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-50 bg-slate-50/50 flex-shrink-0">
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !opponentId || !time}
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? 'Bokar...' : 'Boka match'}
                    </button>
                </div>
            </div>
        </div>
    );
};
