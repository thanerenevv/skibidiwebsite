import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  increment,
  serverTimestamp,
  runTransaction,
  type Unsubscribe,
  getDocs,
} from 'firebase/firestore';
import { db } from './config';
import type { Game, Player, Answer, GameStatus } from '../types';
import { QUESTIONS } from '../data/questions';
import { calculatePoints, QUESTION_DURATION_SECONDS } from '../lib/scoring';

const GAMES_COL = 'games';

function gameRef(gameCode: string) {
  return doc(db, GAMES_COL, gameCode);
}

function playersCol(gameCode: string) {
  return collection(db, GAMES_COL, gameCode, 'players');
}

function playerRef(gameCode: string, playerId: string) {
  return doc(db, GAMES_COL, gameCode, 'players', playerId);
}

function answersCol(gameCode: string) {
  return collection(db, GAMES_COL, gameCode, 'answers');
}

function answerRef(gameCode: string, questionIndex: number, playerId: string) {
  return doc(db, GAMES_COL, gameCode, 'answers', `${questionIndex}_${playerId}`);
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Firebase operation timed out')), ms)
    ),
  ]);
}

export async function createGame(
  hostId: string,
  gameCode: string,
  hostName?: string,
): Promise<void> {
  await withTimeout(
    setDoc(gameRef(gameCode), {
      code: gameCode,
      status: 'waiting' as GameStatus,
      currentQuestionIndex: 0,
      questionStartTime: null,
      questionDuration: QUESTION_DURATION_SECONDS,
      hostId,
      hostName: hostName?.trim() || 'โฮสต์',
      playerCount: 0,
      createdAt: Date.now(),
      totalQuestions: QUESTIONS.length,
    } satisfies Game),
    10000,
  );
}

export async function checkGame(
  gameCode: string,
): Promise<'waiting' | 'active' | 'not_found'> {
  const snap = await getDoc(gameRef(gameCode));
  if (!snap.exists()) return 'not_found';
  const data = snap.data() as Game;
  if (data.status === 'waiting') return 'waiting';
  return 'active';
}

export async function joinGame(
  gameCode: string,
  playerId: string,
  nickname: string,
): Promise<void> {
  await withTimeout(
    runTransaction(db, async (txn) => {
      const pRef = playerRef(gameCode, playerId);
      const snap = await txn.get(pRef);
      // Already an active player in this room — leave score/count untouched.
      if (snap.exists() && !(snap.data() as Player).left) return;
      txn.set(pRef, {
        id: playerId,
        nickname,
        score: 0,
        joinedAt: Date.now(),
      } satisfies Player);
      txn.update(gameRef(gameCode), { playerCount: increment(1) });
    }),
    10000,
  );
}

export async function startGame(gameCode: string): Promise<void> {
  await withTimeout(
    updateDoc(gameRef(gameCode), {
      status: 'question' as GameStatus,
      currentQuestionIndex: 0,
      questionStartTime: Date.now(),
    }),
    10000,
  );
}

export async function showLeaderboard(gameCode: string): Promise<void> {
  await updateDoc(gameRef(gameCode), {
    status: 'leaderboard' as GameStatus,
  });
}

export async function nextQuestion(gameCode: string, currentIndex: number): Promise<void> {
  const nextIndex = currentIndex + 1;
  if (nextIndex >= QUESTIONS.length) {
    await updateDoc(gameRef(gameCode), {
      status: 'finished' as GameStatus,
    });
  } else {
    await updateDoc(gameRef(gameCode), {
      status: 'question' as GameStatus,
      currentQuestionIndex: nextIndex,
      questionStartTime: Date.now(),
    });
  }
}

export async function endGame(gameCode: string): Promise<void> {
  await updateDoc(gameRef(gameCode), {
    status: 'finished' as GameStatus,
  });
}

export async function submitAnswer(
  gameCode: string,
  playerId: string,
  questionIndex: number,
  choiceIndex: number,
  questionStartTime: number,
  questionDurationSeconds: number,
): Promise<{ isCorrect: boolean; pointsEarned: number }> {
  const question = QUESTIONS[questionIndex];
  const isCorrect = choiceIndex === question.correctIndex;
  const elapsedMs = Date.now() - questionStartTime;
  const durationMs = questionDurationSeconds * 1000;
  const pointsEarned = calculatePoints(isCorrect, elapsedMs, durationMs);

  const aRef = answerRef(gameCode, questionIndex, playerId);
  const existing = await getDoc(aRef);
  if (existing.exists()) {
    return { isCorrect, pointsEarned: 0 };
  }

  await setDoc(aRef, {
    playerId,
    questionIndex,
    choiceIndex,
    answeredAt: Date.now(),
    isCorrect,
    pointsEarned,
  } satisfies Answer);

  if (pointsEarned > 0) {
    await updateDoc(playerRef(gameCode, playerId), {
      score: increment(pointsEarned),
    });
  }

  return { isCorrect, pointsEarned };
}

export async function getPlayerAnswer(
  gameCode: string,
  playerId: string,
  questionIndex: number,
): Promise<Answer | null> {
  const snap = await getDoc(answerRef(gameCode, questionIndex, playerId));
  if (!snap.exists()) return null;
  return snap.data() as Answer;
}

export async function getAnswerCount(
  gameCode: string,
  questionIndex: number,
): Promise<number> {
  const q = query(answersCol(gameCode), where('questionIndex', '==', questionIndex));
  const snap = await getDocs(q);
  return snap.size;
}

export function subscribeToGame(
  gameCode: string,
  cb: (game: Game | null) => void,
): Unsubscribe {
  return onSnapshot(gameRef(gameCode), (snap) => {
    if (!snap.exists()) {
      cb(null);
      return;
    }
    cb(snap.data() as Game);
  });
}

export async function leaveGame(gameCode: string, playerId: string): Promise<void> {
  await withTimeout(
    runTransaction(db, async (txn) => {
      const pRef = playerRef(gameCode, playerId);
      const snap = await txn.get(pRef);
      if (!snap.exists() || (snap.data() as Player).left) return;
      txn.update(pRef, { left: true });
      txn.update(gameRef(gameCode), { playerCount: increment(-1) });
    }),
    10000,
  );
}

/**
 * Live list of rooms anyone can join (status === 'waiting'), newest first.
 * Uses an equality-only query (no composite index required) and sorts/filters
 * client-side; stale rooms left open for a long time are hidden automatically.
 */
export function subscribeToAvailableGames(
  cb: (games: Game[]) => void,
): Unsubscribe {
  const q = query(collection(db, GAMES_COL), where('status', '==', 'waiting'));
  return onSnapshot(
    q,
    (snap) => {
      const cutoff = Date.now() - 12 * 60 * 60 * 1000; // hide rooms older than 12h
      const games = snap.docs
        .map((d) => d.data() as Game)
        .filter((g) => (g.createdAt ?? 0) > cutoff)
        .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
      cb(games);
    },
    (err) => {
      console.error('subscribeToAvailableGames error:', err);
      cb([]);
    },
  );
}

export function subscribeToPlayers(
  gameCode: string,
  cb: (players: Player[]) => void,
): Unsubscribe {
  const q = query(playersCol(gameCode), orderBy('score', 'desc'));
  return onSnapshot(q, (snap) => {
    const players = snap.docs
      .map((d) => d.data() as Player)
      .filter((p) => !p.left);
    cb(players);
  }, (err) => {
    console.error('subscribeToPlayers error:', err);
  });
}

export function subscribeToAnswerCount(
  gameCode: string,
  questionIndex: number,
  cb: (count: number) => void,
): Unsubscribe {
  const q = query(answersCol(gameCode), where('questionIndex', '==', questionIndex));
  return onSnapshot(q, (snap) => {
    cb(snap.size);
  });
}

export function subscribeToPlayerAnswer(
  gameCode: string,
  playerId: string,
  questionIndex: number,
  cb: (answer: Answer | null) => void,
): Unsubscribe {
  return onSnapshot(answerRef(gameCode, questionIndex, playerId), (snap) => {
    if (!snap.exists()) {
      cb(null);
      return;
    }
    cb(snap.data() as Answer);
  });
}

export function subscribeToPlayer(
  gameCode: string,
  playerId: string,
  cb: (player: Player | null) => void,
): Unsubscribe {
  return onSnapshot(playerRef(gameCode, playerId), (snap) => {
    if (!snap.exists()) { cb(null); return; }
    cb(snap.data() as Player);
  });
}

export async function applyScorePenalty(
  gameCode: string,
  playerId: string,
  penaltyAmount: number,
): Promise<void> {
  if (penaltyAmount <= 0) return;
  const pRef = playerRef(gameCode, playerId);
  await runTransaction(db, async (txn) => {
    const snap = await txn.get(pRef);
    if (!snap.exists()) return;
    const current = (snap.data() as Player).score;
    txn.update(pRef, { score: current - penaltyAmount });
  });
}

export { serverTimestamp };
