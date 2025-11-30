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
    // For completed matches
    winnerId?: string;
    winnerName?: string;
    loserId?: string;
    loserName?: string;
    winnerScore?: number;
    loserScore?: number;

    // For scheduled matches (and general info)
    player1Id?: string;
    player1Name?: string;
    player2Id?: string;
    player2Name?: string;

    date: Date;
    status: 'completed' | 'scheduled';

    isRankSwap?: boolean;
    eloChange?: number;
    aiCommentary?: string;
}