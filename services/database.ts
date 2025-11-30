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
    writeBatch,
    onSnapshot
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

export const subscribeToMatches = (callback: (matches: Match[]) => void) => {
    const q = query(collection(db, MATCHES_COLLECTION), orderBy('date', 'desc'), limit(50));
    return onSnapshot(q, (snapshot) => {
        const matches = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date)
            } as Match;
        });
        callback(matches);
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

export const scheduleMatch = async (player1Id: string, player2Id: string, date: Date): Promise<string> => {
    const player1Ref = doc(db, PLAYERS_COLLECTION, player1Id);
    const player2Ref = doc(db, PLAYERS_COLLECTION, player2Id);
    const [p1Snap, p2Snap] = await Promise.all([getDoc(player1Ref), getDoc(player2Ref)]);

    if (!p1Snap.exists() || !p2Snap.exists()) throw new Error("Players not found");

    const p1Data = p1Snap.data() as Player;
    const p2Data = p2Snap.data() as Player;

    const matchDocRef = await addDoc(collection(db, MATCHES_COLLECTION), {
        player1Id,
        player1Name: p1Data.name,
        player2Id,
        player2Name: p2Data.name,
        date: date,
        status: 'scheduled'
    });

    return matchDocRef.id;
};

export const registerMatchResult = async (
    matchId: string | null,
    resultData: {
        winnerId: string;
        loserId: string;
        winnerScore: number;
        loserScore: number;
    }
): Promise<void> => {
    const winnerRef = doc(db, PLAYERS_COLLECTION, resultData.winnerId);
    const loserRef = doc(db, PLAYERS_COLLECTION, resultData.loserId);

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

    // Rank Swap Logic
    let isRankSwap = false;
    let newWinnerRank = winnerData.rank;
    let newLoserRank = loserData.rank;

    if (winnerData.rank > loserData.rank) {
        isRankSwap = true;
        newWinnerRank = loserData.rank;
        newLoserRank = winnerData.rank;
    }

    const updateData = {
        ...resultData,
        winnerName: winnerData.name,
        loserName: loserData.name,
        eloChange,
        isRankSwap,
        aiCommentary: '', // Lämnas tom initialt för snabbare UI-respons
        status: 'completed',
        date: new Date() // Set completion date to now
    };

    const batch = writeBatch(db);
    let finalMatchRef;

    if (matchId) {
        // Update existing scheduled match
        finalMatchRef = doc(db, MATCHES_COLLECTION, matchId);
        batch.update(finalMatchRef, updateData);
    } else {
        // Create new match (fallback if needed)
        finalMatchRef = doc(collection(db, MATCHES_COLLECTION));
        batch.set(finalMatchRef, updateData);
    }

    batch.update(winnerRef, {
        elo: newWinnerElo,
        wins: winnerData.wins + 1,
        streak: newWinnerStreak,
        rank: newWinnerRank
    });

    batch.update(loserRef, {
        elo: newLoserElo,
        losses: loserData.losses + 1,
        streak: newLoserStreak,
        rank: newLoserRank
    });

    await batch.commit();

    // Generera AI-kommentar asynkront i bakgrunden
    generateMatchCommentary(
        winnerData.name,
        loserData.name,
        resultData.winnerScore,
        resultData.loserScore,
        isRankSwap,
        {
            winnerStreak: newWinnerStreak,
            loserStreak: newLoserStreak,
            winnerWinRate,
            loserWinRate
        }
    ).then(aiCommentary => {
        updateDoc(finalMatchRef, { aiCommentary });
    }).catch(error => {
        console.error("Error generating AI commentary:", error);
    });
};

export const recalculateAllRanks = async () => {
    // This function now merely normalizes ranks to ensure they are 1..N without gaps.
    // It preserves the existing relative order of ranks.
    const allPlayers = await getPlayers();

    // Sort by current rank to preserve order
    allPlayers.sort((a, b) => (a.rank || 9999) - (b.rank || 9999));

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

export const compressEloScores = async () => {
    const players = await getPlayers();
    const batch = writeBatch(db);

    // Target average ELO
    const TARGET_ELO = 1500;
    // Compression factor (0.5 means gaps become 50% smaller)
    const COMPRESSION_FACTOR = 0.5;

    players.forEach(player => {
        const currentElo = player.elo || 1200;
        // Calculate new ELO: move 50% closer to 1500
        const diff = currentElo - TARGET_ELO;
        const newElo = Math.round(TARGET_ELO + (diff * COMPRESSION_FACTOR));

        const playerRef = doc(db, PLAYERS_COLLECTION, player.id);
        batch.update(playerRef, { elo: newElo });
    });

    await batch.commit();
};
