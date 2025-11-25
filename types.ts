export interface Player {
 id: string;
 name: string;
 rank: number;
 elo: number;
 wins: number;
 losses: number;
 streak: number;
 joinedAt: Date;
}

export interface Match {
 id: string;
 winnerId: string;
 winnerName: string;
 loserId: string;
 loserName: string;
 winnerScore: number;
 loserScore: number;
 date: Date;
 isRankSwap?: boolean;
 eloChange?: number;
 aiCommentary?: string;
}