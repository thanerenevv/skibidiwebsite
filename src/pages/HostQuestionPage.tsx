import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  subscribeToGame,
  subscribeToPlayers,
  subscribeToAnswerCount,
  showLeaderboard,
  endGame,
} from '../firebase/gameService';
import { QUESTIONS } from '../data/questions';
import { CHOICE_COLORS, CHOICE_LABELS } from '../lib/utils';
import CountdownTimer from '../components/ui/CountdownTimer';
import type { Game, Player } from '../types';

interface HostQuestionPageProps {
  gameCode: string;
  onLeaderboard: () => void;
  onGameFinished: () => void;
}

function countdownColor(n: number) {
  if (n >= 4) return '#22C55E';
  if (n === 3) return '#F59E0B';
  if (n === 2) return '#F97316';
  return '#EF4444';
}

export default function HostQuestionPage({
  gameCode,
  onLeaderboard,
  onGameFinished,
}: HostQuestionPageProps) {
  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [answerCount, setAnswerCount] = useState(0);
  const [advancing, setAdvancing] = useState(false);
  const [allAnsweredCountdown, setAllAnsweredCountdown] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);
  const allAnsweredTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const unsub = subscribeToGame(gameCode, (g) => {
      setGame(g);
      if (!g) return;
      if (g.status === 'leaderboard') onLeaderboard();
      if (g.status === 'finished') onGameFinished();
    });
    return unsub;
  }, [gameCode, onLeaderboard, onGameFinished]);

  useEffect(() => {
    const unsub = subscribeToPlayers(gameCode, setPlayers);
    return unsub;
  }, [gameCode]);

  useEffect(() => {
    if (!game) return;
    const unsub = subscribeToAnswerCount(gameCode, game.currentQuestionIndex, setAnswerCount);
    return unsub;
  }, [gameCode, game?.currentQuestionIndex]);

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

  // Auto-advance when every player has answered
  useEffect(() => {
    if (
      game?.status !== 'question' ||
      players.length === 0 ||
      answerCount < players.length ||
      advancing ||
      countdown > 0
    ) {
      if (allAnsweredTimerRef.current) {
        clearInterval(allAnsweredTimerRef.current);
        allAnsweredTimerRef.current = null;
        setAllAnsweredCountdown(null);
      }
      return;
    }
    setAllAnsweredCountdown(3);
    allAnsweredTimerRef.current = setInterval(() => {
      setAllAnsweredCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(allAnsweredTimerRef.current!);
          allAnsweredTimerRef.current = null;
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    const advanceTimeout = setTimeout(() => {
      showLeaderboard(gameCode).catch(() => {});
    }, 3000);
    return () => {
      clearInterval(allAnsweredTimerRef.current!);
      allAnsweredTimerRef.current = null;
      clearTimeout(advanceTimeout);
      setAllAnsweredCountdown(null);
    };
  }, [answerCount, players.length, game?.status, advancing, gameCode, countdown]);

  const handleShowLeaderboard = useCallback(async () => {
    if (advancing) return;
    setAdvancing(true);
    try { await showLeaderboard(gameCode); }
    finally { setAdvancing(false); }
  }, [gameCode, advancing]);

  const handleEndGame = useCallback(async () => {
    if (advancing) return;
    setAdvancing(true);
    try { await endGame(gameCode); }
    finally { setAdvancing(false); }
  }, [gameCode, advancing]);

  if (!game) {
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ width: 36, height: 36, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#8B5CF6', borderRadius: '50%' }}
        />
      </div>
    );
  }

  if (game.status !== 'question') return null;

  const question = QUESTIONS[game.currentQuestionIndex];
  const progress = (game.currentQuestionIndex + 1) / game.totalQuestions;
  const answerProgress = players.length > 0 ? answerCount / players.length : 0;
  const isCountingDown = countdown > 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          flex: '0 0 56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 18px',
          background: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          gap: 16,
        }}
      >
        {/* Q counter + progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: 'rgba(255,255,255,0.65)',
              letterSpacing: '0.5px',
              background: 'rgba(255,255,255,0.08)',
              borderRadius: 8,
              padding: '4px 10px',
            }}
          >
            ข้อ {game.currentQuestionIndex + 1} / {game.totalQuestions}
          </div>
          {/* Progress bar */}
          <div style={{ width: 100, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
            <motion.div
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{ height: '100%', background: 'linear-gradient(90deg, #6366F1, #8B5CF6)', borderRadius: 2 }}
            />
          </div>
        </div>

        {/* Answer count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <motion.span
            key={answerCount}
            initial={{ scale: 1.4, color: '#60A5FA' }}
            animate={{ scale: 1, color: '#fff' }}
            transition={{ type: 'spring', stiffness: 500, damping: 18 }}
            style={{ fontSize: 20, fontWeight: 900, color: '#fff', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}
          >
            {answerCount}
          </motion.span>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
            / {players.length} ตอบแล้ว
          </span>
        </div>

        {/* Game code chip */}
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: 'rgba(255,255,255,0.4)',
            letterSpacing: '2px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 7,
            padding: '3px 10px',
            flexShrink: 0,
          }}
        >
          {gameCode}
        </div>
      </div>

      {/* ── Question card ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={game.currentQuestionIndex}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{ flex: '0 0 auto', padding: '10px 14px 8px' }}
        >
          <div
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 18,
              overflow: 'hidden',
            }}
          >
            <div style={{ height: 3, background: 'linear-gradient(90deg, #6366F1, #8B5CF6, #EC4899)' }} />
            <div
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <p
                style={{
                  flex: 1,
                  margin: 0,
                  fontSize: 'clamp(15px, 2.8vw, 22px)',
                  fontWeight: 700,
                  color: '#fff',
                  lineHeight: 1.5,
                  letterSpacing: '-0.2px',
                }}
              >
                {question.text}
              </p>
              {/* Timer — only show when active */}
              {!isCountingDown && game.questionStartTime && (
                <div style={{ flexShrink: 0 }}>
                  <CountdownTimer
                    questionStartTime={game.questionStartTime}
                    durationSeconds={game.questionDuration}
                    onExpired={handleShowLeaderboard}
                    size={60}
                  />
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── Choices grid / Countdown overlay ── */}
      <div
        style={{
          flex: 1,
          padding: '0 14px 0',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr 1fr',
          gap: 8,
          minHeight: 0,
          position: 'relative',
        }}
      >
        {question.choices.map((choice, i) => (
          <motion.div
            key={`${game.currentQuestionIndex}-${i}`}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{
              opacity: isCountingDown ? 0.25 : 1,
              scale: 1,
              filter: isCountingDown ? 'blur(2px)' : 'blur(0px)',
            }}
            transition={{
              opacity: { duration: 0.35, delay: isCountingDown ? 0 : i * 0.07 },
              scale: { delay: isCountingDown ? 0 : i * 0.07, type: 'spring', stiffness: 300, damping: 24 },
              filter: { duration: 0.3 },
            }}
            style={{
              background: CHOICE_COLORS[i].bg,
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '0 18px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                flexShrink: 0,
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'rgba(255,255,255,0.22)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                fontWeight: 900,
                color: '#fff',
              }}
            >
              {CHOICE_LABELS[i]}
            </div>
            <span
              style={{
                fontSize: 'clamp(12px, 1.8vw, 16px)',
                fontWeight: 600,
                color: '#fff',
                lineHeight: 1.35,
              }}
            >
              {choice}
            </span>
          </motion.div>
        ))}

        {/* Countdown overlay */}
        <AnimatePresence>
          {isCountingDown && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.4 } }}
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                pointerEvents: 'none',
                zIndex: 10,
              }}
            >
              {/* Pulsing ring behind the number */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <motion.div
                  key={`ring-${countdown}`}
                  initial={{ scale: 0.6, opacity: 0.8 }}
                  animate={{ scale: 2.2, opacity: 0 }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                  style={{
                    position: 'absolute',
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    border: `3px solid ${countdownColor(countdown)}`,
                    pointerEvents: 'none',
                  }}
                />
                <motion.div
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background: `${countdownColor(countdown)}18`,
                    border: `2px solid ${countdownColor(countdown)}55`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={countdown}
                      initial={{ scale: 1.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.3, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                      style={{
                        fontSize: 'clamp(52px, 10vw, 72px)',
                        fontWeight: 900,
                        color: countdownColor(countdown),
                        lineHeight: 1,
                        textShadow: `0 0 32px ${countdownColor(countdown)}99`,
                      }}
                    >
                      {countdown}
                    </motion.span>
                  </AnimatePresence>
                </motion.div>
              </div>

              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.6)',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                }}
              >
                เตรียมพร้อม!
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Footer ── */}
      <div style={{ flex: '0 0 auto', padding: '8px 14px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* All-answered banner */}
        <AnimatePresence>
          {allAnsweredCountdown !== null && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 360, damping: 26 }}
              style={{
                background: 'rgba(34,197,94,0.12)',
                border: '1px solid rgba(34,197,94,0.35)',
                borderRadius: 14,
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.18, 1] }}
                transition={{ duration: 0.7, repeat: Infinity }}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'rgba(34,197,94,0.7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#4ADE80' }}>ทุกคนตอบแล้ว!</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
                  ไปดูผลใน {allAnsweredCountdown}...
                </div>
              </div>
              <motion.div
                key={allAnsweredCountdown}
                initial={{ scale: 1.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                style={{ fontSize: 26, fontWeight: 900, color: '#4ADE80', minWidth: 28, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}
              >
                {allAnsweredCountdown}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Answer progress bar */}
        {!isCountingDown && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                คำตอบที่ได้รับ
              </span>
              <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.55)', fontVariantNumeric: 'tabular-nums' }}>
                {answerCount} / {players.length}
              </span>
            </div>
            <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
              <motion.div
                animate={{ width: `${answerProgress * 100}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                style={{
                  height: '100%',
                  background: answerProgress === 1
                    ? 'linear-gradient(90deg, #22C55E, #16A34A)'
                    : 'linear-gradient(90deg, #6366F1, #8B5CF6)',
                  borderRadius: 3,
                }}
              />
            </div>
          </div>
        )}

        {/* Host controls */}
        <div style={{ display: 'flex', gap: 8 }}>
          <motion.button
            onClick={handleShowLeaderboard}
            disabled={advancing || isCountingDown}
            whileHover={!advancing && !isCountingDown ? { y: -1 } : {}}
            whileTap={!advancing && !isCountingDown ? { scale: 0.97 } : {}}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              border: 'none',
              borderRadius: 12,
              padding: '13px 16px',
              color: '#fff',
              fontSize: 14,
              fontWeight: 800,
              cursor: advancing || isCountingDown ? 'not-allowed' : 'pointer',
              opacity: advancing || isCountingDown ? 0.45 : 1,
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
              transition: 'opacity 200ms',
            }}
          >
            {advancing ? (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }}
              />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            ดูผล
          </motion.button>

          <motion.button
            onClick={handleEndGame}
            disabled={advancing}
            whileHover={!advancing ? { y: -1 } : {}}
            whileTap={!advancing ? { scale: 0.97 } : {}}
            style={{
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.28)',
              borderRadius: 12,
              padding: '13px 18px',
              color: '#FCA5A5',
              fontSize: 13,
              fontWeight: 700,
              cursor: advancing ? 'not-allowed' : 'pointer',
              opacity: advancing ? 0.55 : 1,
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
              transition: 'background 150ms',
            }}
          >
            จบเกม
          </motion.button>
        </div>
      </div>
    </div>
  );
}
