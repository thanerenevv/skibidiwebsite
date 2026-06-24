export type GameStatus = 'waiting' | 'question' | 'leaderboard' | 'finished';

export interface Game {
  code: string;
  status: GameStatus;
  currentQuestionIndex: number;
  questionStartTime: number | null;
  questionDuration: number;
  hostId: string;
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
}
