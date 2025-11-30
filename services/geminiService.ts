import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface MatchContext {
  winnerStreak?: number;
  winnerWinRate?: number;
  loserStreak?: number;
  loserWinRate?: number;
}

export const generateMatchCommentary = async (
  winnerName: string,
  loserName: string,
  winnerScore: number,
  loserScore: number,
  isRankSwap: boolean,
  context?: MatchContext
): Promise<string> => {
  try {
    let contextInfo = "";

    if (context) {
      const wStreak = context.winnerStreak
        ? (context.winnerStreak > 0 ? `${context.winnerStreak} raka vinster` : `${Math.abs(context.winnerStreak)} raka förluster`)
        : "okänd svit";

      const lStreak = context.loserStreak
        ? (context.loserStreak > 0 ? `${context.loserStreak} raka vinster` : `${Math.abs(context.loserStreak)} raka förluster`)
        : "okänd svit";

      contextInfo = `
Statistik och formkurva:
- Vinnaren (${winnerName}): ${wStreak}, ${context.winnerWinRate ?? '?'}% win rate.
- Förloraren (${loserName}): ${lStreak}, ${context.loserWinRate ?? '?'}% win rate.
`;
    }

    const prompt = `
Du är en entusiastisk, humoristisk och lite kaxig sportkommentator för en pingisturnering på kontoret.
Skriv en kort, kärnfull och rolig kommentar (max 2 meningar) på svenska om följande match.

Matchfakta:
Vinnare: ${winnerName} (Poäng: ${winnerScore})
Förlorare: ${loserName} (Poäng: ${loserScore})
${isRankSwap ? "OBS: Detta var en SKRÄLL! Vinnaren klättrade förbi förloraren i rankingen!" : "Favoriten höll undan."}

${contextInfo}

Instruktioner:
- Använd statistiken ovan för att ge kommentaren mer färg.
- Var kreativ.
- Var inte för formell, använd gärna kontorshumor.
- Använd emojis för att förstärka känslan.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Vilken match! 🏓";

  } catch (error) {
    console.error("Error generating commentary:", error);
    return "Matchen är registrerad! 🏓";
  }
};
