import React, { useState, useEffect, useCallback } from 'react';
import { RankingList } from './components/RankingList';
import { MatchRegistration } from './components/MatchRegistration';
import { MatchHistory } from './components/MatchHistory';
import { AddPlayer } from './components/AddPlayer';
import { SetupGuide } from './components/SetupGuide';
import { AdminLogin } from './components/AdminLogin';
import { useAdmin } from './hooks/useAdmin';
import { getPlayers, getMatches, addMatch, removePlayer, removeMatch, updatePlayer, addPlayer } from './services/database';
import { Player, Match } from './types';
import { generateMatchCommentary } from './services/geminiService';
import { Trophy, Loader2, Lock, Unlock } from 'lucide-react';

function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { isAdmin } = useAdmin();

  const refreshData = useCallback(async () => {
    try {
      const [fetchedPlayers, fetchedMatches] = await Promise.all([
        getPlayers(),
        getMatches()
      ]);
      // Sortera spelare baserat på rank (lägst rank är bäst)
      setPlayers(fetchedPlayers.sort((a, b) => a.rank - b.rank));
      setMatches(fetchedMatches);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleRegisterMatch = async (winnerId: string, loserId: string, winnerScore: number, loserScore: number) => {
    setRegistering(true);
    try {
      const winner = players.find(p => p.id === winnerId);
      const loser = players.find(p => p.id === loserId);
      
      if (!winner || !loser) return;

      let isRankSwap = false;
      if (winner.rank > loser.rank) {
        const oldWinnerRank = winner.rank;
        const oldLoserRank = loser.rank;
        
        await updatePlayer(winner.id, { rank: oldLoserRank });
        await updatePlayer(loser.id, { rank: oldWinnerRank });
        isRankSwap = true;
      }

      await updatePlayer(winner.id, {
        wins: winner.wins + 1,
        streak: winner.streak > 0 ? winner.streak + 1 : 1
      });

      await updatePlayer(loser.id, {
        losses: loser.losses + 1,
        streak: loser.streak < 0 ? loser.streak - 1 : -1
      });

      let aiCommentary = undefined;
      try {
        aiCommentary = await generateMatchCommentary(winner.name, loser.name, winnerScore, loserScore, isRankSwap);
      } catch (e) {
        console.warn("Kunde inte hämta AI-kommentar");
      }

      await addMatch({
        winnerId, winnerName: winner.name,
        loserId, loserName: loser.name,
        winnerScore, loserScore,
        date: new Date(),
        isRankSwap,
        aiCommentary
      });

      await refreshData();
    } catch (error) {
      console.error("Kunde inte registrera match:", error);
      alert("Ett fel uppstod vid matchregistrering.");
    } finally {
      setRegistering(false);
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

  const handleRemoveMatch = async (id: string) => {
    try {
      await removeMatch(id);
      await refreshData();
    } catch (error) {
      console.error("Kunde inte ta bort match:", error);
      alert("Kunde inte ta bort match.");
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
              <button 
                className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 hover:bg-emerald-100 transition-colors"
                onClick={() => setIsLoginOpen(true)} 
              >
                <Unlock className="w-3 h-3" />
                Admin
              </button>
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