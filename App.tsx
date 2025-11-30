import React, { useState, useEffect, useCallback } from 'react';
import { RankingList } from './components/RankingList';
import { MatchHistory } from './components/MatchHistory';
import { AddPlayer } from './components/AddPlayer';
import { SetupGuide } from './components/SetupGuide';
import { AdminLogin } from './components/AdminLogin';
import { BookingModal } from './components/BookingModal';
import { UpcomingMatches } from './components/UpcomingMatches';
import { useAdmin } from './hooks/useAdmin';
import { getPlayers, getMatches, removePlayer, removeMatch, updatePlayer, recalculateAllRanks, subscribeToMatches } from './services/database';
import { Player, Match } from './types';
import { Trophy, Loader2, Lock, Unlock, LogOut } from 'lucide-react';
import { DataSeeder } from './components/DataSeeder';

function App() {
    const [players, setPlayers] = useState<Player[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [bookingChallenger, setBookingChallenger] = useState<Player | null>(null);
    const { isAdmin, isAuthenticated, logout } = useAdmin();

    const refreshData = useCallback(async () => {
        if (!isAuthenticated) return;

        try {
            const [fetchedPlayers, fetchedMatches] = await Promise.all([
                getPlayers(),
                getMatches()
            ]);
            // Sätt data direkt, sortering sköts i komponenterna
            setPlayers(fetchedPlayers);
            setMatches(fetchedMatches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        } catch (error) {
            console.error("Fel vid hämtning av data:", error);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        // Initial fetch for players
        refreshData();

        // Subscribe to matches for real-time updates (including AI commentary)
        const unsubscribe = subscribeToMatches((updatedMatches) => {
            setMatches(updatedMatches);
        });

        return () => unsubscribe();
    }, [isAuthenticated, refreshData]);

    const handleBookingRequest = (player: Player) => {
        setBookingChallenger(player);
        setIsBookingOpen(true);
    };

    const handleRemoveMatch = async (id: string) => {
        try {
            const matchToRemove = matches.find(m => m.id === id);
            if (!matchToRemove) return;

            // Only revert stats if the match was completed
            if (matchToRemove.status === 'completed') {
                const currentPlayers = await getPlayers();
                const winner = currentPlayers.find(p => p.id === matchToRemove.winnerId);
                const loser = currentPlayers.find(p => p.id === matchToRemove.loserId);

                if (winner && loser) {
                    // 1. Återställ stats
                    const newWinnerWins = Math.max(0, winner.wins - 1);
                    const newLoserLosses = Math.max(0, loser.losses - 1);

                    // 2. Återställ ELO
                    const eloChange = matchToRemove.eloChange || 0;
                    const newWinnerElo = (winner.elo || 1200) - eloChange;
                    const newLoserElo = (loser.elo || 1200) + eloChange;

                    // 3. Räkna om streak
                    const allMatches = await getMatches();
                    const otherMatches = allMatches
                        .filter(m => m.id !== id && m.status === 'completed')
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                    const calculateStreak = (playerId: string) => {
                        let currentStreak = 0;
                        for (const m of otherMatches) {
                            if (m.winnerId === playerId) {
                                currentStreak = currentStreak > 0 ? currentStreak + 1 : 1;
                            } else if (m.loserId === playerId) {
                                currentStreak = currentStreak < 0 ? currentStreak - 1 : -1;
                            }
                        }
                        return currentStreak;
                    };

                    const newWinnerStreak = calculateStreak(winner.id);
                    const newLoserStreak = calculateStreak(loser.id);

                    // 4. Återställ rank om det var ett rank-byte
                    let newWinnerRank = winner.rank;
                    let newLoserRank = loser.rank;

                    if (matchToRemove.isRankSwap) {
                        // Byt plats på dem igen
                        newWinnerRank = loser.rank;
                        newLoserRank = winner.rank;
                    }

                    await updatePlayer(winner.id, {
                        wins: newWinnerWins,
                        streak: newWinnerStreak,
                        elo: newWinnerElo,
                        rank: newWinnerRank
                    });

                    await updatePlayer(loser.id, {
                        losses: newLoserLosses,
                        streak: newLoserStreak,
                        elo: newLoserElo,
                        rank: newLoserRank
                    });
                }
            }

            await removeMatch(id);
            await recalculateAllRanks();
            await refreshData();
        } catch (error) {
            console.error("Kunde inte ta bort match:", error);
            alert("Ett fel uppstod när matchen skulle tas bort.");
        }
    };

    const handleRemovePlayer = async (id: string) => {
        try {
            await removePlayer(id);
            await refreshData();
        } catch (error) {
            console.error("Kunde inte ta bort spelare:", error);
            alert("Kunde inte ta bort spelare.");
        }
    };

    if (!isAuthenticated) {
        return (
            <AdminLogin
                isOpen={true}
                onClose={() => { }}
                isGlobal={true}
            />
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                    <p className="text-slate-400 font-medium animate-pulse">Laddar ligan...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-24">
            <header className="fixed top-0 inset-x-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 rotate-3 transition-transform hover:rotate-6">
                                <Trophy className="w-5 h-5 text-white" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white"></div>
                        </div>
                        <div>
                            <h1 className="font-bold text-slate-800 text-lg leading-tight tracking-tight">VT-Stegen</h1>
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Official Ranking</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {isAdmin ? (
                            <>
                                <span className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                                    <Unlock className="w-3 h-3" />
                                    Admin
                                </span>
                                <button
                                    onClick={logout}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                    title="Logga ut"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setIsLoginOpen(true)}
                                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                title="Logga in som admin"
                            >
                                <Lock className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <AdminLogin
                isOpen={isLoginOpen}
                onClose={() => setIsLoginOpen(false)}
            />

            <BookingModal
                isOpen={isBookingOpen}
                onClose={() => setIsBookingOpen(false)}
                challenger={bookingChallenger}
                players={players}
                matches={matches}
                onMatchScheduled={refreshData}
            />

            <main className="max-w-7xl mx-auto px-4 py-8 mt-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
                    <div className="lg:col-span-8 space-y-8">
                        <section>
                            <RankingList
                                players={players}
                                matches={matches}
                                onRemovePlayer={handleRemovePlayer}
                                onBookingRequest={handleBookingRequest}
                            />
                        </section>
                    </div>

                    <div className="lg:col-span-4 space-y-6">
                        <div className="sticky top-24 space-y-6">
                            <section>
                                <UpcomingMatches
                                    matches={matches}
                                    players={players}
                                    onMatchCompleted={refreshData}
                                    onRemoveMatch={handleRemoveMatch}
                                />
                            </section>

                            {isAdmin && (
                                <section className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-4">
                                    <AddPlayer onPlayerAdded={refreshData} />
                                </section>
                            )}

                            <section>
                                <MatchHistory
                                    matches={matches}
                                    onRemoveMatch={handleRemoveMatch}
                                />
                            </section>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="py-8 text-center text-slate-400 text-sm">
                <p>© 2025-2026 VT-Stegen - vid tekniska problem maila robert.palmer@vasttrafik.se</p>
            </footer>

        </div>
    );
}

export default App;