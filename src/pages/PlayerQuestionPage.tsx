import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  subscribeToGame,
  subscribeToPlayer,
  subscribeToPlayerAnswer,
  subscribeToPlayers,
  submitAnswer,
  applyScorePenalty,
  applyScoreBonus,
  stealScore,
} from '../firebase/gameService';
import { QUESTIONS } from '../data/questions';
import { CHOICE_LABELS } from '../lib/utils';
import AnswerButton from '../components/ui/AnswerButton';
import CountdownTimer from '../components/ui/CountdownTimer';
import WheelOfMisfortune, { type WheelOutcome } from '../components/ui/WheelOfMisfortune';
import WheelOfFortune, { type FortuneOutcome } from '../components/ui/WheelOfFortune';
import type { Game, Answer, Player } from '../types';

interface PlayerQuestionPageProps {
  gameCode: string;
  playerId: string;
  onLeaderboard: () => void;
  onGameFinished: () => void;
}

type ButtonState = 'default' | 'selected' | 'correct' | 'wrong' | 'reveal-correct' | 'reveal-wrong';

export default function PlayerQuestionPage({
  gameCode,
  playerId,
  onLeaderboard,
  onGameFinished,
}: PlayerQuestionPageProps) {
  const [game, setGame] = useState<Game | null>(null);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [pointsEarned, setPointsEarned] = useState<number | null>(null);

  // Penalty wheel state
  const [showWheel, setShowWheel] = useState(false);
  const [penaltyApplied, setPenaltyApplied] = useState(false);

  // Fortune wheel state
  const [showFortune, setShowFortune] = useState(false);
  const [fortuneApplied, setFortuneApplied] = useState(false);

  // Skip mechanic: ref avoids stale closure in question-change effect
  const willSkipNextRef = useRef(false);
  const [isSkipping, setIsSkipping] = useState(false);
  // Immunity: next WoM is skipped (granted by WoF immunity outcome)
  const wheelImmuneRef = useRef(false);

  const prevStatusRef = useRef<string | null>(null);
  const pendingNavRef = useRef<'leaderboard' | 'finished' | null>(null);
  // Mirror spinning state into a ref so the status effect can read without stale closures.
  const showWheelRef = useRef(false);
  showWheelRef.current = showWheel;
  const showFortuneRef = useRef(false);
  showFortuneRef.current = showFortune;

  const handleLeaderboard = useCallback(onLeaderboard, []);
  const handleFinished = useCallback(onGameFinished, []);

  useEffect(() => {
    if (!game) return;
    const status = game.status;
    if (prevStatusRef.current === status) return;
    prevStatusRef.current = status;

    if (status === 'leaderboard' || status === 'finished') {
      const nav = status === 'leaderboard' ? 'leaderboard' : 'finished';
      if (showWheelRef.current || showFortuneRef.current) {
        // A wheel is still spinning — defer navigation until onComplete fires
        pendingNavRef.current = nav;
      } else {
        nav === 'leaderboard' ? handleLeaderboard() : handleFinished();
      }
    }
  }, [game, handleLeaderboard, handleFinished]);

  useEffect(() => {
    const unsub = subscribeToGame(gameCode, setGame);
    return unsub;
  }, [gameCode]);

  useEffect(() => {
    const unsub = subscribeToPlayer(gameCode, playerId, setPlayer);
    return unsub;
  }, [gameCode, playerId]);

  useEffect(() => {
    const unsub = subscribeToPlayers(gameCode, setPlayers);
    return unsub;
  }, [gameCode]);

  // Reset per-question state when question index advances
  useEffect(() => {
    if (game?.currentQuestionIndex === undefined) return;

    // If the host moved to the next question while the wheel was still running,
    // flush the pending navigation now so the player lands on the leaderboard
    // (which will immediately forward them to the next question).
    const pending = pendingNavRef.current;
    if (pending) {
      pendingNavRef.current = null;
      pending === 'leaderboard' ? handleLeaderboard() : handleFinished();
      return;
    }

    setAnswer(null);
    setPointsEarned(null);
    setSubmitting(false);
    setShowWheel(false);
    setPenaltyApplied(false);
    setShowFortune(false);
    setFortuneApplied(false);

    if (willSkipNextRef.current) {
      setIsSkipping(true);
      willSkipNextRef.current = false;
    } else {
      setIsSkipping(false);
    }
  }, [game?.currentQuestionIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe to this player's answer for current question
  useEffect(() => {
    if (!game) return;
    const unsub = subscribeToPlayerAnswer(gameCode, playerId, game.currentQuestionIndex, setAnswer);
    return unsub;
  }, [gameCode, playerId, game?.currentQuestionIndex]);

  // Trigger WoM 1.4s after a wrong answer (skip if immune from WoF)
  useEffect(() => {
    if (!answer || answer.isCorrect || penaltyApplied || showWheel || isSkipping) return;
    if (wheelImmuneRef.current) {
      wheelImmuneRef.current = false;
      setPenaltyApplied(true);
      return;
    }
    const t = setTimeout(() => setShowWheel(true), 1400);
    return () => clearTimeout(t);
  }, [answer, penaltyApplied, showWheel, isSkipping]);

  // Trigger WoF 1.4s after a correct answer
  useEffect(() => {
    if (!answer || !answer.isCorrect || fortuneApplied || showFortune) return;
    const t = setTimeout(() => setShowFortune(true), 1400);
    return () => clearTimeout(t);
  }, [answer, fortuneApplied, showFortune]);

  async function handleChoiceClick(choiceIndex: number) {
    if (!game || answer || submitting || isSkipping) return;
    setSubmitting(true);
    try {
      const result = await submitAnswer(
        gameCode,
        playerId,
        game.currentQuestionIndex,
        choiceIndex,
        game.questionStartTime!,
        game.questionDuration,
      );
      setPointsEarned(result.pointsEarned);
    } catch {
      /* ignore duplicate submissions */
    } finally {
      setSubmitting(false);
    }
  }

  async function handleWheelComplete(outcome: WheelOutcome, penaltyAmount: number) {
    setShowWheel(false);
    setPenaltyApplied(true);

    if (outcome === 'skip') {
      willSkipNextRef.current = true;
    } else if (penaltyAmount > 0) {
      await applyScorePenalty(gameCode, playerId, penaltyAmount);
    }

    // If the game already moved to leaderboard/finished while the wheel was
    // running, execute the deferred navigation now that penalty is applied.
    const pending = pendingNavRef.current;
    if (pending) {
      pendingNavRef.current = null;
      pending === 'leaderboard' ? handleLeaderboard() : handleFinished();
    }
  }

  async function handleFortuneComplete(outcome: FortuneOutcome, bonusAmount: number, victimId?: string) {
    setShowFortune(false);
    setFortuneApplied(true);

    if (outcome === 'immunity') {
      wheelImmuneRef.current = true;
    } else if ((outcome === 'steal25' || outcome === 'steal50') && victimId && bonusAmount > 0) {
      await stealScore(gameCode, playerId, victimId, bonusAmount);
    } else if (bonusAmount > 0) {
      await applyScoreBonus(gameCode, playerId, bonusAmount);
    }

    const pending = pendingNavRef.current;
    if (pending) {
      pendingNavRef.current = null;
      pending === 'leaderboard' ? handleLeaderboard() : handleFinished();
    }
  }

  const spinner = (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        style={{ width: 40, height: 40, border: '4px solid #E2E8F0', borderTopColor: '#2563EB', borderRadius: '50%' }}
      />
    </div>
  );

  if (!game) return spinner;

  const isQuestion = game.status === 'question';
  const question = isQuestion ? QUESTIONS[game.currentQuestionIndex] : null;
  const hasAnswered = answer !== null;

  function getButtonState(i: number): ButtonState {
    if (!hasAnswered || !question) return 'default';
    if (answer.choiceIndex === i) return answer.isCorrect ? 'correct' : 'wrong';
    if (i === question.correctIndex && !answer.isCorrect) return 'reveal-correct';
    return 'reveal-wrong';
  }

  return (
    <>
    {/* When status is no longer 'question', show spinner behind the wheels */}
    {!isQuestion && !showWheel && !showFortune && spinner}
    <div
      style={{
        minHeight: '100vh',
        display: isQuestion ? 'flex' : 'none',
        flexDirection: 'column',
        padding: '0 0 env(safe-area-inset-bottom, 16px)',
      }}
    >
      <div
        style={{
          padding: '16px 20px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 10,
            padding: '6px 14px',
            fontSize: 13,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.9)',
          }}
        >
          ข้อ {game.currentQuestionIndex + 1} / {game.totalQuestions}
        </div>
        {game.questionStartTime && (
          <CountdownTimer
            questionStartTime={game.questionStartTime}
            durationSeconds={game.questionDuration}
            size={52}
          />
        )}
      </div>

      <div
        style={{
          padding: '16px 20px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          maxWidth: 520,
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={game.currentQuestionIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%', position: 'relative' }}
          >
            {question?.choices.map((choice, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: isSkipping ? 0.4 : 1, x: 0 }}
                transition={{ delay: i * 0.06, type: 'spring', stiffness: 300, damping: 22 }}
              >
                <AnswerButton
                  index={i}
                  text={choice}
                  onClick={() => handleChoiceClick(i)}
                  disabled={hasAnswered || submitting || isSkipping}
                  state={getButtonState(i)}
                />
              </motion.div>
            ))}

            {/* Skip overlay */}
            <AnimatePresence>
              {isSkipping && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 16,
                    background: 'rgba(0,0,0,0.55)',
                    backdropFilter: 'blur(3px)',
                  }}
                >
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #4C1D95, #7C3AED)',
                      borderRadius: 20,
                      padding: '20px 32px',
                      textAlign: 'center',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    }}
                  >
                    <div style={{ fontSize: 36, marginBottom: 8 }}>🚫</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 4 }}>
                      ถูกข้าม!
                    </div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>
                      โทษจากคำถามก่อนหน้า
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Wrong / correct result card */}
      <AnimatePresence>
        {hasAnswered && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            style={{
              position: 'fixed',
              bottom: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              background: answer.isCorrect
                ? 'linear-gradient(135deg, #22C55E, #16A34A)'
                : 'linear-gradient(135deg, #EF4444, #DC2626)',
              borderRadius: 20,
              padding: '16px 28px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              minWidth: 260,
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5, delay: 0.1 }}>
              {answer.isCorrect ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="rgba(255,255,255,0.2)"/>
                  <path d="M8 12l3 3 5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="rgba(255,255,255,0.2)"/>
                  <path d="M15 9l-6 6M9 9l6 6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              )}
            </motion.div>
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>
                {answer.isCorrect ? 'ถูกต้อง!' : 'ไม่ถูกต้อง'}
              </div>
              {answer.isCorrect && pointsEarned !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 600 }}
                >
                  +{pointsEarned.toLocaleString()} คะแนน
                </motion.div>
              )}
              {!answer.isCorrect && (
                <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 500 }}>
                  คำตอบที่ถูก: {CHOICE_LABELS[question?.correctIndex ?? 0]}
                  {!penaltyApplied && !showWheel && (
                    <motion.span
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ duration: 0.7, repeat: Infinity }}
                      style={{ marginLeft: 6 }}
                    >
                      🎡
                    </motion.span>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!hasAnswered && !submitting && !isSkipping && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            textAlign: 'center',
            padding: '8px 20px 20px',
            color: 'rgba(255,255,255,0.6)',
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          เลือกคำตอบที่คิดว่าถูกต้อง
        </motion.div>
      )}

    </div>

    {/* Penalty Wheel overlay — kept at a stable tree position so React never remounts it mid-spin */}
    <AnimatePresence>
      {showWheel && (
        <WheelOfMisfortune
          key="wheel"
          playerScore={player?.score ?? 0}
          onComplete={handleWheelComplete}
        />
      )}
    </AnimatePresence>

    {/* Fortune Wheel overlay */}
    <AnimatePresence>
      {showFortune && (
        <WheelOfFortune
          key="fortune-wheel"
          playerScore={player?.score ?? 0}
          playerId={playerId}
          players={players}
          onComplete={handleFortuneComplete}
        />
      )}
    </AnimatePresence>
    </>
  );
}
