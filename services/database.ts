import { Player, Match } from '../types';
import { firestore } from './firebaseConfig';
import {
 collection,
 getDocs,
 setDoc,
 doc,
 deleteDoc,
 writeBatch,
 query,
 orderBy
} from 'firebase/firestore';

export const isConfigured = true;

// Namn på kollektionerna i Firestore
const PLAYERS_COL = 'players';
const MATCHES_COL = 'matches';

export const db = {
 getPlayers: async (): Promise<Player[]> => {
 try {
 const snapshot = await getDocs(collection(firestore, PLAYERS_COL));
 const players: Player[] = [];
 snapshot.forEach((doc) => {
 players.push(doc.data() as Player);
 });
 return players;
 } catch (e) {
 console.error("Fel vid hämtning av spelare:", e);
 return [];
 }
 },

 getMatches: async (): Promise<Match[]> => {
 try {
 // Hämta matcher sorterade på datum (nyast först)
 const q = query(collection(firestore, MATCHES_COL), orderBy('date', 'desc'));
 const snapshot = await getDocs(q);
 const matches: Match[] = [];
 snapshot.forEach((doc) => {
 matches.push(doc.data() as Match);
 });
 return matches;
 } catch (e) {
 console.error("Fel vid hämtning av matcher:", e);
 return [];
 }
 },

 addPlayer: async (player: Player): Promise<void> => {
 try {
 // Vi använder setDoc med player.id som dokument-ID för att ha kontroll över ID:t
 await setDoc(doc(firestore, PLAYERS_COL, player.id), player);
 } catch (e) {
 console.error("Fel vid tillägg av spelare:", e);
 throw e;
 }
 },

 deletePlayer: async (playerId: string): Promise<void> => {
 try {
 await deleteDoc(doc(firestore, PLAYERS_COL, playerId));
 } catch (e) {
 console.error("Fel vid borttagning av spelare:", e);
 throw e;
 }
 },

 updatePlayers: async (players: Player[]): Promise<void> => {
 try {
 // Batch-uppdatering är effektivare när flera dokument ska ändras samtidigt
 const batch = writeBatch(firestore);
 players.forEach((player) => {
 const ref = doc(firestore, PLAYERS_COL, player.id);
 batch.set(ref, player, { merge: true });
 });
 await batch.commit();
 } catch (e) {
 console.error("Fel vid uppdatering av spelare:", e);
 throw e;
 }
 },

 addMatch: async (match: Match): Promise<void> => {
 try {
 await setDoc(doc(firestore, MATCHES_COL, match.id), match);
 } catch (e) {
 console.error("Fel vid registrering av match:", e);
 throw e;
 }
 },

 resetDatabase: async (): Promise<void> => {
 if (window.confirm("Detta rensar all data permanent från databasen. Är du säker?")) {
 try {
 const batch = writeBatch(firestore);
 
 const playersSnapshot = await getDocs(collection(firestore, PLAYERS_COL));
 playersSnapshot.forEach((d) => batch.delete(d.ref));

 const matchesSnapshot = await getDocs(collection(firestore, MATCHES_COL));
 matchesSnapshot.forEach((d) => batch.delete(d.ref));

 await batch.commit();
 window.location.reload();
 } catch (e) {
 console.error("Kunde inte återställa databasen:", e);
 alert("Ett fel uppstod vid återställning.");
 }
 }
 }
};