import { initializeApp } from "firebase/app";
import { 
 getFirestore, 
 collection, 
 getDocs, 
 addDoc, 
 deleteDoc, 
 doc, 
 updateDoc, 
 query, 
 orderBy, 
 limit, 
 Timestamp, 
 getDoc,
 writeBatch
} from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';
import { Player, Match } from '../types';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

const PLAYERS_COLLECTION = 'players';
const MATCHES_COLLECTION = 'matches';

// K-factor determines how much ratings change. 32 is common for casual leagues.
const K_FACTOR = 32;

export const getPlayers = async (): Promise<Player[]> => {
 const q = query(collection(db, PLAYERS_COLLECTION), orderBy('rank', 'asc'));
 const querySnapshot = await getDocs(q);
 return querySnapshot.docs.map(doc => {
 const data = doc.data();
 return {
 id: doc.id,
 ...data,
 // Default legacy players to 1200 ELO if missing
 elo: data.elo || 1200,
 joinedAt: data.joinedAt instanceof Timestamp ? data.joinedAt.toDate() : new Date(data.joinedAt || Date.now())
 } as Player;
 });
};

export const getMatches = async (): Promise<Match[]> => {
 const q = query(collection(db, MATCHES_COLLECTION), orderBy('date', 'desc'), limit(50));
 const querySnapshot = await getDocs(q);
 return querySnapshot.docs.map(doc => {
 const data = doc.data();
 return {
 id: doc.id,
 ...data,
 date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date)
 } as Match;
 });
};

export const addPlayer = async (name: string): Promise<Player> => {
 // Get current count to determine rank (put at bottom)
 const players = await getPlayers();
 const newRank = players.length + 1;

 const newPlayer = {
 name,
 rank: newRank,
 elo: 1200, // Starting ELO
 wins: 0,
 losses: 0,
 streak: 0,
 joinedAt: new Date()
 };
 
 const docRef = await addDoc(collection(db, PLAYERS_COLLECTION), newPlayer);
 return { id: docRef.id, ...newPlayer } as Player;
};

export const removePlayer = async (id: string): Promise<void> => {
 await deleteDoc(doc(db, PLAYERS_COLLECTION, id));
 // Note: Ideally we should shift ranks of other players here, 
 // but it will self-correct on next match calculation.
};

export const removeMatch = async (id: string): Promise<void> => {
 await deleteDoc(doc(db, MATCHES_COLLECTION, id));
 // Removing a match is complex with ELO. 
 // For simplicity in this version, we delete the record but don't revert ELO changes 
 // to avoid cascading recalculation issues.
};

// Calculate expected score based on ELO
const getExpectedScore = (ratingA: number, ratingB: number): number => {
 return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
};

export const addMatch = async (matchData: Omit<Match, 'id' | 'date'>): Promise<string> => {
 const winnerRef = doc(db, PLAYERS_COLLECTION, matchData.winnerId);
 const loserRef = doc(db, PLAYERS_COLLECTION, matchData.loserId);

 const [winnerSnap, loserSnap] = await Promise.all([getDoc(winnerRef), getDoc(loserRef)]);
 
 if (!winnerSnap.exists() || !loserSnap.exists()) {
 throw new Error("Players not found");
 }

 const winnerData = winnerSnap.data() as Player;
 const loserData = loserSnap.data() as Player;

 // Ensure ELO exists (migration fallback)
 const winnerElo = winnerData.elo || 1200;
 const loserElo = loserData.elo || 1200;

 // Calculate ELO change
 const expectedWinner = getExpectedScore(winnerElo, loserElo);
 const eloChange = Math.round(K_FACTOR * (1 - expectedWinner));

 const newWinnerElo = winnerElo + eloChange;
 const newLoserElo = loserElo - eloChange;

 // Determine streak
 const newWinnerStreak = winnerData.streak > 0 ? winnerData.streak + 1 : 1;
 const newLoserStreak = loserData.streak < 0 ? loserData.streak - 1 : -1;

 // 1. Save the Match
 const matchDocRef = await addDoc(collection(db, MATCHES_COLLECTION), {
 ...matchData,
 eloChange,
 date: new Date(),
 isRankSwap: winnerData.rank > loserData.rank // Legacy flag, still useful for UI
 });

 // 2. Update the two players involved
 const batch = writeBatch(db);

 batch.update(winnerRef, {
 elo: newWinnerElo,
 wins: winnerData.wins + 1,
 streak: newWinnerStreak
 });

 batch.update(loserRef, {
 elo: newLoserElo,
 losses: loserData.losses + 1,
 streak: newLoserStreak
 });

 await batch.commit();

 // 3. Recalculate Ranks for EVERYONE
 // This ensures the "within 2 places" rule always works on fresh data
 await recalculateAllRanks();

 return matchDocRef.id;
};

// Helper to sort all players by ELO and update their rank field
const recalculateAllRanks = async () => {
 const allPlayers = await getPlayers();
 
 // Sort by ELO descending
 allPlayers.sort((a, b) => b.elo - a.elo);

 const batch = writeBatch(db);
 let hasUpdates = false;

 allPlayers.forEach((player, index) => {
 const newRank = index + 1;
 if (player.rank !== newRank) {
 const playerRef = doc(db, PLAYERS_COLLECTION, player.id);
 batch.update(playerRef, { rank: newRank });
 hasUpdates = true;
 }
 });

 if (hasUpdates) {
 await batch.commit();
 }
};

export const updatePlayer = async (id: string, data: Partial<Player>): Promise<void> => {
 const playerRef = doc(db, PLAYERS_COLLECTION, id);
 await updateDoc(playerRef, data);
};
