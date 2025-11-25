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
import { generateMatchCommentary } from './geminiService';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

const PLAYERS_COLLECTION = 'players';
const MATCHES_COLLECTION = 'matches';

const K_FACTOR = 32;

export const getPlayers = async (): Promise<Player[]> => {
 const q = query(collection(db, PLAYERS_COLLECTION), orderBy('elo', 'desc'));
 const querySnapshot = await getDocs(q);
 return querySnapshot.docs.map(doc => {
 const data = doc.data();
 return {
 id: doc.id,
 ...data,
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

export const addPlayer = async (name: string, initialElo: number = 1200): Promise<Player> => {
 const players = await getPlayers();
 const newRank = players.length + 1;

 const newPlayer = {
 name,
 rank: newRank,
 elo: initialElo,
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
 await recalculateAllRanks();
};

export const removeMatch = async (id: string): Promise<void> => {
 await deleteDoc(doc(db, MATCHES_COLLECTION, id));
};

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

 const winnerElo = winnerData.elo || 1200;
 const loserElo = loserData.elo || 1200;

 const expectedWinner = getExpectedScore(winnerElo, loserElo);
 const eloChange = Math.round(K_FACTOR * (1 - expectedWinner));

 const newWinnerElo = winnerElo + eloChange;
 const newLoserElo = loserElo - eloChange;

 const newWinnerStreak = winnerData.streak > 0 ? winnerData.streak + 1 : 1;
 const newLoserStreak = loserData.streak < 0 ? loserData.streak - 1 : -1;

 const winnerWinRate = Math.round(((winnerData.wins + 1) / (winnerData.wins + winnerData.losses + 1)) * 100);
 const loserWinRate = Math.round((loserData.wins / (loserData.wins + loserData.losses + 1)) * 100);

 // Generera AI-kommentar INNAN vi sparar, så den visas direkt i UI
 const aiCommentary = await generateMatchCommentary(
 winnerData.name,
 loserData.name,
 matchData.winnerScore,
 matchData.loserScore,
 false,
 {
 winnerStreak: newWinnerStreak,
 loserStreak: newLoserStreak,
 winnerWinRate,
 loserWinRate
 }
 );

 // Skapa dokumentet med kommentaren
 const matchDocRef = await addDoc(collection(db, MATCHES_COLLECTION), {
 ...matchData, 
 eloChange,
 date: new Date(),
 isRankSwap: false,
 aiCommentary // Nu med data!
 });

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

 // Kör endast rangordning i bakgrunden
 recalculateAllRanks().catch(err => {
 console.error("Bakgrundsjobb (ranking) fel:", err);
 });

 return matchDocRef.id;
};

export const recalculateAllRanks = async () => {
 const allPlayers = await getPlayers();
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
