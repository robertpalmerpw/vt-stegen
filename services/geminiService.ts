import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateMatchCommentary = async (
  winnerName: string,
  loserName: string,
  winnerScore: number,
  loserScore: number,
  isRankSwap: boolean
): Promise<string> => {
  try {
    const prompt = `
      Du är en entusiastisk sportkommentator för en pingisturnering på kontoret.
      Skriv en kort, rolig och energisk kommentar (max 2 meningar) på svenska om följande match:
      
      Vinnare: ${winnerName} (Poäng: ${winnerScore})
      Förlorare: ${loserName} (Poäng: ${loserScore})
      ${isRankSwap ? "OBS: Detta var en skräll! Vinnaren klättrade i rankingen!" : "Favoriten höll undan."}
      
      Använd emojis.
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