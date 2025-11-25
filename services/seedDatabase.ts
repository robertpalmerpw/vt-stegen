import { writeBatch, doc, collection } from 'firebase/firestore';
import { db } from './database';

const INITIAL_TOP_ELO = 1600;
const ELO_STEP = 20;

// Listan från uppgiften
const PLAYERS_LIST = [
 "Azhar Ahmad",
 "Viktor Molin",
 "David Hesslegård",
 "Thomas Johansson",
 "Pierre Lamont",
 "Lucas Jensen",
 "Christian Carlé",
 "Patric Borg",
 "Tommy Cvetkovski",
 "Andreas Dahlgren",
 "Robert Palmer",
 "Jonas Otterlind",
 "Henrik Lai",
 "Hampus Olsson",
 "Torvald Asplund",
 "Jari Tammisto",
 "David Hvarfven",
 "Johan Tallhage",
 "Leon Lindeberg",
 "Joel Holtzberg",
 "Andreas Kjellén",
 "Johan Austrin",
 "Carl Johansson",
 "John Andersson",
 "Jonathan Nord",
 "Aaron Vera Alvarez",
 "Magnus Blomfeldt",
 "Sam Wernersson",
 "Gustav Angenete",
 "Peter Nyström",
 "Ace Arnsmar",
 "Rasa Hansson",
 "Malin Linekrans",
 "Johan Arvendal",
 "Malena Inglis",
 "Kristian Lagerström",
 "Kristina Fahlén",
 "Agim Zekaj",
 "Linus Bergman"
];

export const seedPlayers = async () => {
 const batch = writeBatch(db);
 const collectionRef = collection(db, 'players');

 PLAYERS_LIST.forEach((name, index) => {
 // Skapa en referens för ett nytt dokument
 const docRef = doc(collectionRef);
 
 // Beräkna ELO baserat på listplacering (Högst upp = högst ELO)
 // Rank 1: 1600, Rank 2: 1580, osv...
 const rank = index + 1;
 const elo = INITIAL_TOP_ELO - (index * ELO_STEP);

 const playerData = {
 name: name.trim(),
 rank: rank,
 elo: elo,
 wins: 0,
 losses: 0,
 streak: 0,
 joinedAt: new Date()
 };

 batch.set(docRef, playerData);
 });

 try {
 await batch.commit();
 console.log("Lyckades importera" + PLAYERS_LIST.length + "spelare.");
 return { success: true, count: PLAYERS_LIST.length };
 } catch (error) {
 console.error("Fel vid import av spelare:", error);
 throw error;
 }
};
