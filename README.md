# 🏓 VT-Stegen - Pingisligan

Detta är ett webbaserat rankingsystem för pingis (bordtennis), byggt för att hålla koll på matcher, statistik och den ständigt skiftande hierarkin på kontoret. Appen använder ett ELO-baserat system för att ranka spelare och Google Gemini AI för att generera roliga matchkommentarer.

<div align="center">
<img width="800" alt="App Screenshot" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

## 🚀 Funktioner

* Rankinglista: Realtidsuppdaterad tabell baserad på ELO-poäng. Visar vinststatistik, 'streaks' och nuvarande form.
* Matchregistrering: Enkelt gränssnitt för att mata in resultat. Systemet räknar automatiskt ut poängförändring.
* AI-Kommentator: Varje match får en unik, genererad kommentar från Google Gemini baserat på resultatet.
* Statistik: Detaljerad historik för varje spelare och match.
* Admin-läge: Lösenordsskyddad vy för att lägga till nya spelare eller ta bort felaktiga matcher.

## 🛠 Teknisk Stack

* Frontend: React 19, TypeScript, Vite
* Styling: Tailwind CSS
* Backend/Databas: Firebase (Firestore)
* AI: Google Generative AI (Gemini 2.5 Flash)
* Ikoner: Lucide React

## ⚙️ Installation och Setup

För att köra projektet lokalt behöver du Node.js installerat samt ett Firebase-projekt.

### 1. Klona och installera

bash
npm install


### 2. Konfigurera Firebase

Appen kräver en Firestore-databas.

1. Gå till Firebase Console.
2. Skapa ett nytt projekt.
3. Skapa en Firestore Database (starta i Test Mode för enkelhetens skull).
4. Skapa en Web App i projektinställningarna.
5. Kopiera konfigurations-objektet.
6. Öppna services/firebaseConfig.ts och ersätt värdena med dina egna.

### 3. Miljövariabler (AI)

För att AI-kommentatorn ska fungera behöver du en API-nyckel från Google.

1. Skaffa en nyckel på Google AI Studio.
2. Öppna .env.local och lägg till nyckeln:

env
GEMINI_API_KEY=din_api_nyckel_här


### 4. Starta appen

bash
npm run dev


## 📏 Spelregler & Logik

### Rankingsystemet
Appen använder en ELO-algoritm (K-faktor 32) för att beräkna poäng.
* Vinner man mot en högre rankad spelare får man fler poäng.
* Förlorar man mot en lägre rankad spelare tappar man fler poäng.
* Efter varje match sorteras hela listan om baserat på de nya ELO-poängen för att avgöra rank (1:a, 2:a, 3:a osv).

### Matchregler i appen
* Utmanare: Spelaren som registrerar (eller står först) väljs som "Utmanare".
* Motståndare: Man kan endast välja motståndare som ligger inom räckhåll (logiken styrs i MatchRegistration.tsx, oftast +/- 2 placeringar om man vill ha en strikt stege, men i koden är det just nu öppet baserat på rank).
* Oavgjort: Finns inte i pingis!

## 🔐 Admin

För att lägga till nya spelare eller ta bort matcher krävs inloggning. Lösenordet är hårdkodat i hooks/useAdmin.ts (Standard: pingis123). Byt detta om du deployar appen publikt!

## 📂 Projektstruktur

* components/ - Återanvändbara UI-komponenter (RankingList, MatchRegistration, etc).
* services/ - Logik för databas (Firebase) och AI (Gemini).
* types/ - TypeScript-definitioner för Spelare och Matcher.
* hooks/ - Custom hooks (t.ex. för admin-status).
