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
import { CHOICE_LABELS, CHOICE_COLORS } from '../lib/utils';
import { formatScore } from '../lib/scoring';
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
  const [countdown, setCountdown] = useState<number>(0);

  const [showWheel, setShowWheel] = useState(false);
  const [penaltyApplied, setPenaltyApplied] = useState(false);

  const [showFortune, setShowFortune] = useState(false);
  const [fortuneApplied, setFortuneApplied] = useState(false);

  const willSkipNextRef = useRef(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const wheelImmuneRef = useRef(false);

  const prevStatusRef = useRef<string | null>(null);
  const pendingNavRef = useRef<'leaderboard' | 'finished' | null>(null);
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
        pendingNavRef.current = nav;
      } else {
        nav === 'leaderboard' ? handleLeaderboard() : handleFinished();
      }
    }
  }, [game, handleLeaderboard, handleFinished]);

  useEffect(() => { const u = subscribeToGame(gameCode, setGame); return u; }, [gameCode]);

  // Drive the pre-question countdown from questionStartTime
  useEffect(() => {
    const tick = () => {
      if (!game?.questionStartTime) { setCountdown(0); return; }
      const ms = game.questionStartTime - Date.now();
      setCountdown(ms > 0 ? Math.ceil(ms / 1000) : 0);
    };
    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [game?.questionStartTime]);
  useEffect(() => { const u = subscribeToPlayer(gameCode, playerId, setPlayer); return u; }, [gameCode, playerId]);
  useEffect(() => { const u = subscribeToPlayers(gameCode, setPlayers); return u; }, [gameCode]);

  useEffect(() => {
    if (game?.currentQuestionIndex === undefined) return;
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

  useEffect(() => {
    if (!game) return;
    const u = subscribeToPlayerAnswer(gameCode, playerId, game.currentQuestionIndex, setAnswer);
    return u;
  }, [gameCode, playerId, game?.currentQuestionIndex]);

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

  useEffect(() => {
    if (!answer || !answer.isCorrect || fortuneApplied || showFortune) return;
    const t = setTimeout(() => setShowFortune(true), 1400);
    return () => clearTimeout(t);
  }, [answer, fortuneApplied, showFortune]);

  async function handleChoiceClick(choiceIndex: number) {
    if (!game || answer || submitting || isSkipping || countdown > 0) return;
    setSubmitting(true);
    try {
      const result = await submitAnswer(
        gameCode, playerId, game.currentQuestionIndex,
        choiceIndex, game.questionStartTime!, game.questionDuration,
      );
      setPointsEarned(result.pointsEarned);
    } catch { /* ignore duplicate submissions */ }
    finally { setSubmitting(false); }
  }

  async function handleWheelComplete(outcome: WheelOutcome, penaltyAmount: number) {
    setShowWheel(false);
    setPenaltyApplied(true);
    if (outcome === 'skip') willSkipNextRef.current = true;
    else if (penaltyAmount > 0) await applyScorePenalty(gameCode, playerId, penaltyAmount);
    const pending = pendingNavRef.current;
    if (pending) { pendingNavRef.current = null; pending === 'leaderboard' ? handleLeaderboard() : handleFinished(); }
  }

  async function handleFortuneComplete(outcome: FortuneOutcome, bonusAmount: number, victimId?: string) {
    setShowFortune(false);
    setFortuneApplied(true);
    if (outcome === 'immunity') wheelImmuneRef.current = true;
    else if ((outcome === 'steal25' || outcome === 'steal50') && victimId && bonusAmount > 0)
      await stealScore(gameCode, playerId, victimId, bonusAmount);
    else if (bonusAmount > 0) await applyScoreBonus(gameCode, playerId, bonusAmount);
    const pending = pendingNavRef.current;
    if (pending) { pendingNavRef.current = null; pending === 'leaderboard' ? handleLeaderboard() : handleFinished(); }
  }

  const spinner = (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        style={{ width: 36, height: 36, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#8B5CF6', borderRadius: '50%' }}
      />
    </div>
  );

  if (!game) return spinner;

  const isQuestion = game.status === 'question';
  const question = isQuestion ? QUESTIONS[game.currentQuestionIndex] : null;
  const hasAnswered = answer !== null;
  const isCountingDown = countdown > 0;

  function countdownColor(n: number) {
    if (n >= 4) return '#22C55E';
    if (n === 3) return '#F59E0B';
    if (n === 2) return '#F97316';
    return '#EF4444';
  }

  function getButtonState(i: number): ButtonState {
    if (!hasAnswered || !question) return 'default';
    if (answer.choiceIndex === i) return answer.isCorrect ? 'correct' : 'wrong';
    if (i === question.correctIndex && !answer.isCorrect) return 'reveal-correct';
    return 'reveal-wrong';
  }

  function getButtonBg(i: number): string {
    const s = getButtonState(i);
    if (s === 'correct' || s === 'reveal-correct') return '#22C55E';
    if (s === 'wrong') return '#EF4444';
    if (s === 'reveal-wrong') return 'rgba(148,163,184,0.25)';
    return CHOICE_COLORS[i].bg;
  }

  function getButtonOpacity(i: number): number {
    const s = getButtonState(i);
    if (s === 'reveal-wrong') return 0.38;
    return 1;
  }

  return (
    <>
      {/* Spinner behind wheels when transitioning away */}
      {!isQuestion && !showWheel && !showFortune && spinner}

      {/* Main question layout — fixed full viewport, zero free space */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: isQuestion ? 'flex' : 'none',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* ── Zone 1: Header bar ── */}
        <div
          style={{
            flex: '0 0 52px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            background: 'rgba(0,0,0,0.25)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {/* Q counter */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(255,255,255,0.08)',
              borderRadius: 8,
              padding: '4px 10px',
              fontSize: 12,
              fontWeight: 800,
              color: 'rgba(255,255,255,0.7)',
              letterSpacing: '0.5px',
            }}
          >
            ข้อ {game.currentQuestionIndex + 1}
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>/</span>
            {game.totalQuestions}
          </div>

          {/* Player score */}
          {player && (
            <motion.div
              key={player.score}
              initial={{ scale: 1.15, color: '#818CF8' }}
              animate={{ scale: 1, color: 'rgba(255,255,255,0.6)' }}
              transition={{ type: 'spring', stiffness: 400, damping: 18 }}
              style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.6)', fontVariantNumeric: 'tabular-nums' }}
            >
              {formatScore(player.score)} คะแนน
            </motion.div>
          )}

          {/* Timer */}
          {game.questionStartTime ? (
            <CountdownTimer
              questionStartTime={game.questionStartTime}
              durationSeconds={game.questionDuration}
              size={40}
            />
          ) : (
            <div style={{ width: 40 }} />
          )}
        </div>

        {/* ── Zone 2: Question card ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={game.currentQuestionIndex}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{
              flex: '0 0 auto',
              padding: '10px 12px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
            }}
          >
            <div
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 18,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {/* Gradient accent stripe */}
              <div
                style={{
                  height: 3,
                  background: 'linear-gradient(90deg, #6366F1, #8B5CF6, #EC4899)',
                }}
              />

              <div style={{ padding: '14px 18px 16px' }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 'clamp(14px, 3.8vw, 18px)',
                    fontWeight: 700,
                    color: '#fff',
                    lineHeight: 1.55,
                    letterSpacing: '-0.2px',
                  }}
                >
                  {question?.text}
                </p>

                {/* Result badge — slides in after answering */}
                <AnimatePresence>
                  {hasAnswered && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          background: answer.isCorrect
                            ? 'rgba(34,197,94,0.15)'
                            : 'rgba(239,68,68,0.12)',
                          border: `1px solid ${answer.isCorrect ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.25)'}`,
                          borderRadius: 12,
                          padding: '8px 14px',
                        }}
                      >
                        <motion.div
                          initial={{ scale: 0, rotate: -20 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 18, delay: 0.1 }}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 7,
                            background: answer.isCorrect ? 'rgba(34,197,94,0.8)' : 'rgba(239,68,68,0.75)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {answer.isCorrect ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                              <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                              <path d="M6 18L18 6M6 6l12 12" stroke="#fff" strokeWidth="2.8" strokeLinecap="round"/>
                            </svg>
                          )}
                        </motion.div>

                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 800,
                              color: answer.isCorrect ? '#4ADE80' : '#FCA5A5',
                            }}
                          >
                            {answer.isCorrect ? 'ถูกต้อง!' : 'ไม่ถูกต้อง'}
                          </div>
                          {answer.isCorrect && pointsEarned !== null && (
                            <motion.div
                              initial={{ opacity: 0, x: 6 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.2 }}
                              style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}
                            >
                              +{pointsEarned.toLocaleString()} คะแนน
                            </motion.div>
                          )}
                          {!answer.isCorrect && (
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>
                              เฉลย: {CHOICE_LABELS[question?.correctIndex ?? 0]}
                              {!penaltyApplied && !showWheel && (
                                <motion.span
                                  animate={{ opacity: [1, 0.3, 1] }}
                                  transition={{ duration: 0.8, repeat: Infinity }}
                                  style={{ marginLeft: 6, color: 'rgba(255,255,255,0.6)', fontSize: 11 }}
                                >
                                  · วงล้อกำลังมา...
                                </motion.span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* ── Zone 3: Answer buttons — fills remaining space ── */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            padding: '0 12px 12px',
            minHeight: 0,
            position: 'relative',
          }}
        >
          {question?.choices.map((choice, i) => {
            const state = getButtonState(i);
            const isCorrectState = state === 'correct' || state === 'reveal-correct';
            const bg = getButtonBg(i);
            const opacity = isSkipping ? 0.38 : getButtonOpacity(i);

            return (
              <motion.button
                key={i}
                onClick={() => handleChoiceClick(i)}
                disabled={hasAnswered || submitting || isSkipping || isCountingDown}
                initial={{ opacity: 0, x: i % 2 === 0 ? -16 : 16 }}
                animate={{
                  opacity: isCountingDown ? 0.3 : opacity,
                  x: 0,
                  scale: isCorrectState ? [1, 1.025, 1] : 1,
                }}
                transition={{
                  opacity: { duration: 0.25 },
                  x: { delay: i * 0.055, type: 'spring', stiffness: 320, damping: 24 },
                  scale: { duration: 0.4, delay: 0.1 },
                }}
                whileHover={!hasAnswered && !submitting && !isSkipping && !isCountingDown ? { opacity: 0.88 } : {}}
                whileTap={!hasAnswered && !submitting && !isSkipping && !isCountingDown ? { scale: 0.97 } : {}}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: bg,
                  border: 'none',
                  borderRadius: 14,
                  padding: '0 16px',
                  cursor: (hasAnswered || submitting || isSkipping) ? 'default' : 'pointer',
                  outline: 'none',
                  userSelect: 'none',
                  minHeight: 52,
                  boxShadow: isCorrectState
                    ? '0 4px 20px rgba(34,197,94,0.35)'
                    : state === 'wrong'
                    ? '0 4px 20px rgba(239,68,68,0.3)'
                    : '0 2px 10px rgba(0,0,0,0.2)',
                  transition: 'background 250ms, box-shadow 250ms, opacity 200ms',
                  position: 'relative',
                  overflow: 'hidden',
                  fontFamily: 'inherit',
                }}
              >
                {/* Shine on correct */}
                {isCorrectState && (
                  <motion.div
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 0.7, delay: 0.15 }}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)',
                      pointerEvents: 'none',
                    }}
                  />
                )}

                {/* Choice label badge */}
                <div
                  style={{
                    flexShrink: 0,
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    background: 'rgba(255,255,255,0.22)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    fontWeight: 800,
                    color: '#fff',
                  }}
                >
                  {CHOICE_LABELS[i]}
                </div>

                {/* Choice text */}
                <span
                  style={{
                    flex: 1,
                    textAlign: 'left',
                    fontSize: 'clamp(13px, 3.2vw, 15px)',
                    fontWeight: 600,
                    color: '#fff',
                    lineHeight: 1.35,
                  }}
                >
                  {choice}
                </span>

                {/* State icon */}
                <AnimatePresence>
                  {isCorrectState && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                      style={{ flexShrink: 0 }}
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                        <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </motion.div>
                  )}
                  {state === 'wrong' && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                      style={{ flexShrink: 0 }}
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                        <path d="M6 18L18 6M6 6l12 12" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
                      </svg>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}

          {/* Countdown overlay */}
          <AnimatePresence>
            {isCountingDown && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.3 } }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  pointerEvents: 'none',
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={countdown}
                    initial={{ scale: 2.0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                    style={{
                      fontSize: 'clamp(64px, 20vw, 100px)',
                      fontWeight: 900,
                      color: countdownColor(countdown),
                      lineHeight: 1,
                      textShadow: `0 0 40px ${countdownColor(countdown)}88`,
                    }}
                  >
                    {countdown}
                  </motion.div>
                </AnimatePresence>
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '2px', textTransform: 'uppercase' }}
                >
                  เตรียมพร้อม!
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Skip overlay */}
          <AnimatePresence>
            {isSkipping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 14,
                  backdropFilter: 'blur(4px)',
                }}
              >
                <motion.div
                  initial={{ scale: 0.85, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 360, damping: 24, delay: 0.08 }}
                  style={{
                    background: 'linear-gradient(135deg, rgba(76,29,149,0.95), rgba(124,58,237,0.95))',
                    border: '1px solid rgba(167,139,250,0.3)',
                    borderRadius: 20,
                    padding: '20px 32px',
                    textAlign: 'center',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(16px)',
                  }}
                >
                  {/* SVG ban icon instead of emoji */}
                  <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'center' }}>
                    <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.6)" strokeWidth="2"/>
                      <path d="M5.6 5.6l12.8 12.8" stroke="rgba(255,255,255,0.6)" strokeWidth="2.2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px' }}>
                    ถูกข้าม!
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 500, marginTop: 4 }}>
                    โทษจากคำถามก่อนหน้า
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Penalty Wheel overlay */}
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
