export interface Player {
  id: string;
  name: string;
  rank: number;
  wins: number;
  losses: number;
  streak: number; // Positive for win streak, negative for loss streak
}

export interface Match {
  id: string;
  winnerId: string;
  loserId: string;
  winnerScore: number;
  loserScore: number;
  winnerName: string;
  loserName: string;
  date: string;
  aiCommentary?: string;
  isRankSwap: boolean;
}

export interface ChallengeEligibility {
  canChallenge: boolean;
  reason?: string;
}