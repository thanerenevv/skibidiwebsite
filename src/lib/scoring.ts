export const QUESTION_DURATION_SECONDS = 30;
export const BASE_SCORE = 1000;
export const SPEED_BONUS_MAX = 500;

export function calculatePoints(
  isCorrect: boolean,
  elapsedMs: number,
  questionDurationMs: number,
): number {
  if (!isCorrect) return 0;
  const timeRatio = Math.max(0, 1 - elapsedMs / questionDurationMs);
  return BASE_SCORE + Math.floor(SPEED_BONUS_MAX * timeRatio);
}

export function formatScore(score: number): string {
  return score.toLocaleString();
}
