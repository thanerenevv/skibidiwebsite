export type GameStatus = 'waiting' | 'question' | 'leaderboard' | 'finished';

export interface Game {
  code: string;
  status: GameStatus;
  currentQuestionIndex: number;
  questionStartTime: number | null;
  questionDuration: number;
  hostId: string;
  /** Display name for the host/room, shown in the public lobby. */
  hostName?: string;
  /** Best-effort count of active players, maintained on join/leave. */
  playerCount?: number;
  createdAt: number;
  totalQuestions: number;
}

export interface Player {
  id: string;
  nickname: string;
  score: number;
  joinedAt: number;
  left?: boolean;
}

export interface Answer {
  playerId: string;
  questionIndex: number;
  choiceIndex: number;
  answeredAt: number;
  isCorrect: boolean;
  pointsEarned: number;
}

export interface Question {
  id: number;
  text: string;
  choices: string[];
  correctIndex: number;
}

export type AppView =
  | 'home'
  | 'player-join'
  | 'player-waiting'
  | 'player-question'
  | 'player-leaderboard'
  | 'player-final'
  | 'host-dashboard'
  | 'host-question'
  | 'host-leaderboard'
  | 'host-final';

export interface NavState {
  view: AppView;
  gameCode: string | null;
  playerId: string | null;
  playerNickname: string | null;
  initialGameCode?: string | null;
}
