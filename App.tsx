import React, { useState, useEffect, useCallback } from 'react';
import { RankingList } from './components/RankingList';
import { MatchRegistration } from './components/MatchRegistration';
import { MatchHistory } from './components/MatchHistory';
import { AddPlayer } from './components/AddPlayer';
import { SetupGuide } from './components/SetupGuide';
import { AdminLogin } from './components/AdminLogin';
import { useAdmin } from './hooks/useAdmin';
import { getPlayers, getMatches, addMatch, removePlayer, removeMatch, updatePlayer, addPlayer, recalculateAllRanks } from './services/database';
import { Player, Match } from './types';
import { Trophy, Loader2, Lock, Unlock, LogOut } from 'lucide-react';

function App() {
 const [players, setPlayers] = useState<Player[]>([]);
 const [matches, setMatches] = useState<Match[]>([]);
 const [loading, setLoading] = useState(true);
 const [registering, setRegistering] = useState(false);
 const [isLoginOpen, setIsLoginOpen] = useState(false);
 const { isAdmin, isAuthenticated, logout } = useAdmin();

 const refreshData = useCallback(async () => {
 if (!isAuthenticated) return;
 
 try {
 const [fetchedPlayers, fetchedMatches] = await Promise.all([
 getPlayers(),
 getMatches()
 ]);
 // Sortera spelare strikt baserat på ELO (högst rank/ELO först)
 setPlayers(fetchedPlayers.sort((a, b) => b.elo - a.elo));
 // Sortera matcher fallande på datum
 setMatches(fetchedMatches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
 } catch (error) {
 console.error("Fel vid hämtning av data:", error);
 } finally {
 setLoading(false);
 }
 }, [isAuthenticated]);

 useEffect(() => {
 if (isAuthenticated) {
 refreshData();
 } else {
 setLoading(false);
 }
 }, [refreshData, isAuthenticated]);

 const handleRegisterMatch = async (winnerId: string, loserId: string, winnerScore: number, loserScore: number) => {
 setRegistering(true);
 try {
 const winner = players.find(p => p.id === winnerId);
 const loser = players.find(p => p.id === loserId);
 
 if (!winner || !loser) return;

 // Vi anropar addMatch direkt. Den sköter all ELO-beräkning, statsuppdatering och rank-omräkning.
 // OBS: Vi skickar INTE med aiCommentary här för att undvika 'undefined'-fel i Firebase.
 await addMatch({
 winnerId, 
 winnerName: winner.name,
 loserId, 
 loserName: loser.name,
 winnerScore, 
 loserScore,
 date: new Date(),
 isRankSwap: false,
 eloChange: 0, // Beräknas i backend
 });

 await refreshData();
 } catch (error) {
 console.error("Kunde inte registrera match:", error);
 alert("Ett fel uppstod vid matchregistrering.");
 } finally {
 setRegistering(false);
 }
 };

 const handleRemoveMatch = async (id: string) => {
 try {
 const matchToRemove = matches.find(m => m.id === id);
 if (!matchToRemove) return;

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
 .filter(m => m.id !== id)
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

 await updatePlayer(winner.id, {
 wins: newWinnerWins,
 streak: newWinnerStreak,
 elo: newWinnerElo
 });

 await updatePlayer(loser.id, {
 losses: newLoserLosses,
 streak: newLoserStreak,
 elo: newLoserElo
 });
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

 const handleAddPlayer = async (name: string) => {
 try {
 await addPlayer(name);
 await refreshData();
 } catch (error) {
 console.error("Error adding player:", error);
 }
 };

 if (!isAuthenticated) {
 return (
 <AdminLogin 
 isOpen={true} 
 onClose={() => {}} 
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

 <main className="max-w-7xl mx-auto px-4 py-8 mt-16">
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
 <div className="lg:col-span-8 space-y-8">
 <section>
 <RankingList 
 players={players} 
 matches={matches}
 onRemovePlayer={handleRemovePlayer} 
 />
 </section>
 </div>
 
 <div className="lg:col-span-4 space-y-6">
 <div className="sticky top-24 space-y-6">
 <section>
 <MatchRegistration 
 players={players} 
 onRegisterMatch={handleRegisterMatch}
 isSubmitting={registering}
 />
 </section>

 {isAdmin && (
 <section className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-4">
 <AddPlayer onAddPlayer={handleAddPlayer} />
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
 <p>© 2025 Pingisligan</p>
 </footer>
 </div>
 );
}

export default App;