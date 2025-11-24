import React, { useState, useEffect } from 'react';
import { RankingList } from './components/RankingList';
import { MatchRegistration } from './components/MatchRegistration';
import { AddPlayer } from './components/AddPlayer';
import { MatchHistory } from './components/MatchHistory';
import { SetupGuide } from './components/SetupGuide';
import { Player, Match } from './types';
import { generateMatchCommentary } from './services/geminiService';
import { db, isConfigured } from './services/database';
import { Activity, RefreshCw, Cloud } from 'lucide-react';

const App: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Load data from database on mount
  useEffect(() => {
    if (!isConfigured) {
      setIsLoadingData(false);
      return;
    }

    const loadData = async () => {
      setIsLoadingData(true);
      try {
        const [loadedPlayers, loadedMatches] = await Promise.all([
          db.getPlayers(),
          db.getMatches()
        ]);
        // Ensure sorted by rank
        setPlayers(loadedPlayers.sort((a, b) => a.rank - b.rank));
        setMatches(loadedMatches);
      } catch (error) {
        console.error("Failed to load data from database:", error);
      } finally {
        setIsLoadingData(false);
      }
    };
    loadData();
  }, []);

  const handleAddPlayer = async (name: string) => {
    const newPlayer: Player = {
      id: Date.now().toString(),
      name,
      rank: players.length + 1,
      wins: 0,
      losses: 0,
      streak: 0,
    };
    
    const newPlayers = [...players, newPlayer].sort((a, b) => a.rank - b.rank);
    setPlayers(newPlayers);
    
    // Save only the new player to DB
    await db.addPlayer(newPlayer);
  };

  const handleRemovePlayer = async (id: string) => {
    const filtered = players.filter(p => p.id !== id);
    // Re-calculate ranks after removal to avoid gaps
    const newPlayers = filtered.map((p, index) => ({
      ...p,
      rank: index + 1
    }));
    
    setPlayers(newPlayers);
    
    // Delete the player and update the rest (re-ranking)
    await db.deletePlayer(id);
    await db.updatePlayers(newPlayers);
  };

  const handleRegisterMatch = async (winnerId: string, loserId: string, winnerScore: number, loserScore: number) => {
    setIsProcessing(true);
    
    try {
      const winner = players.find(p => p.id === winnerId)!;
      const loser = players.find(p => p.id === loserId)!;
      
      // LOGIC: Swap ranks if lower ranked player (higher rank number) beats higher ranked player
      let isRankSwap = false;
      let newPlayers = [...players];

      if (winner.rank > loser.rank) {
        isRankSwap = true;
        // Swap ranks
        newPlayers = newPlayers.map(p => {
          if (p.id === winnerId) return { ...p, rank: loser.rank };
          if (p.id === loserId) return { ...p, rank: winner.rank };
          return p;
        });
      }

      // Update stats (wins/losses/streak)
      newPlayers = newPlayers.map(p => {
        if (p.id === winnerId) {
          return { 
            ...p, 
            wins: p.wins + 1, 
            streak: p.streak > 0 ? p.streak + 1 : 1 
          };
        }
        if (p.id === loserId) {
          return { 
            ...p, 
            losses: p.losses + 1, 
            streak: p.streak < 0 ? p.streak - 1 : -1 
          };
        }
        return p;
      });

      // Sort by rank again
      newPlayers.sort((a, b) => a.rank - b.rank);
      setPlayers(newPlayers);
      
      // Generate AI Commentary
      const commentary = await generateMatchCommentary(
        winner.name, 
        loser.name, 
        winnerScore, 
        loserScore, 
        isRankSwap
      );

      const newMatch: Match = {
        id: Date.now().toString(),
        winnerId,
        loserId,
        winnerScore,
        loserScore,
        winnerName: winner.name,
        loserName: loser.name,
        date: new Date().toISOString(),
        isRankSwap,
        aiCommentary: commentary
      };

      const newMatches = [newMatch, ...matches];
      setMatches(newMatches);
      
      // Save updates to DB: Add match and update affected players
      await Promise.all([
        db.addMatch(newMatch),
        db.updatePlayers(newPlayers)
      ]);

    } catch (error) {
      console.error("Error registering match:", error);
      alert("Ett fel uppstod när matchen skulle sparas.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Check configuration state before rendering main app
  if (!isConfigured) {
    return <SetupGuide />;
  }

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-700">Hämtar data...</h2>
          <p className="text-sm text-slate-400 mt-2">Läser från lokal lagring...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-20 flex flex-col">
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 p-2 rounded-lg">
               <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
               <h1 className="text-xl font-bold tracking-tight">PingisRank</h1>
               <p className="text-xs text-slate-400 font-medium">Kontorets Officiella Ranking</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8 flex-grow">
        {/* Left Column: Ranking List */}
        <div className="lg:col-span-2 space-y-6">
          <RankingList 
            players={players} 
            onRemovePlayer={handleRemovePlayer} 
          />
          <MatchHistory matches={matches} />
        </div>

        {/* Right Column: Actions */}
        <div className="space-y-6">
          <MatchRegistration 
            players={players} 
            onRegisterMatch={handleRegisterMatch} 
            isSubmitting={isProcessing}
          />
          <AddPlayer onAddPlayer={handleAddPlayer} />
        </div>
      </main>

      <footer className="bg-slate-200 py-6 border-t border-slate-300">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center text-slate-500 text-sm">
          <div className="flex items-center gap-2 text-slate-600 font-medium">
            <Cloud className="w-4 h-4 text-slate-400" />
            <span>Sparat lokalt i webbläsaren</span>
          </div>
          <button 
            onClick={() => db.resetDatabase()}
            className="text-xs hover:text-red-600 transition-colors"
          >
            Återställ data
          </button>
        </div>
      </footer>
    </div>
  );
};

export default App;