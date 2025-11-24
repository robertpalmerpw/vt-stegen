import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// VIKTIGT: Byt ut nedanstående värden mot dina egna från Firebase Console
// Gå till Project Settings -> General -> Your apps -> SDK setup and configuration

// Your web app's Firebase configuration
export const firebaseConfig = {
 apiKey: "AIzaSyAn4c_a1UaL--mEkIkqxdOJSoj_T9QAi_Q",
 authDomain: "pingisrank-ae75c.firebaseapp.com",
 projectId: "pingisrank-ae75c",
 storageBucket: "pingisrank-ae75c.firebasestorage.app",
 messagingSenderId: "903799636478",
 appId: "1:903799636478:web:91178d6ea6669fce7040af"
};

// Initiera Firebase
const app = initializeApp(firebaseConfig);

// Exportera Firestore-databasen så den kan användas i andra filer
export const firestore = getFirestore(app);