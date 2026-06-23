import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MagnetizeButton } from '@/components/ui/magnetize-button';
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
    const unsub = subscribeToAnswerCount(gameCode, game.currentQuestionIndex, (count) => {
      setAnswerCount(count);
    });
    return unsub;
  }, [gameCode, game?.currentQuestionIndex]);

  // Auto-advance when every player has answered
  useEffect(() => {
    if (
      game?.status !== 'question' ||
      players.length === 0 ||
      answerCount < players.length ||
      advancing
    ) {
      if (allAnsweredTimerRef.current) {
        clearInterval(allAnsweredTimerRef.current);
        allAnsweredTimerRef.current = null;
        setAllAnsweredCountdown(null);
      }
      return;
    }

    // Start a 3-second animated countdown then advance
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
  }, [answerCount, players.length, game?.status, advancing, gameCode]);

  const handleShowLeaderboard = useCallback(async () => {
    if (advancing) return;
    setAdvancing(true);
    try {
      await showLeaderboard(gameCode);
    } finally {
      setAdvancing(false);
    }
  }, [gameCode, advancing]);

  const handleEndGame = useCallback(async () => {
    if (advancing) return;
    setAdvancing(true);
    try {
      await endGame(gameCode);
    } finally {
      setAdvancing(false);
    }
  }, [gameCode, advancing]);

  if (!game) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ width: 40, height: 40, border: '4px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%' }}
        />
      </div>
    );
  }

  if (game.status !== 'question') return null;

  const question = QUESTIONS[game.currentQuestionIndex];
  const progress = (game.currentQuestionIndex + 1) / game.totalQuestions;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px',
        gap: 20,
        boxSizing: 'border-box',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '1px' }}>
              Question
            </span>
            <span style={{ fontSize: 28, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
              {game.currentQuestionIndex + 1}
            </span>
            <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
              / {game.totalQuestions}
            </span>
          </div>
          <div
            style={{
              width: 180,
              height: 6,
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <motion.div
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{ height: '100%', background: '#60A5FA', borderRadius: 3 }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <motion.div
              key={answerCount}
              initial={{ scale: 1.4 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              style={{ fontSize: 28, fontWeight: 800, color: '#60A5FA', lineHeight: 1 }}
            >
              {answerCount}
            </motion.div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
              / {players.length} ตอบแล้ว
            </div>
          </div>

          {game.questionStartTime && (
            <CountdownTimer
              questionStartTime={game.questionStartTime}
              durationSeconds={game.questionDuration}
              onExpired={handleShowLeaderboard}
              size={72}
            />
          )}
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={game.currentQuestionIndex}
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          style={{
            background: 'rgba(255,255,255,0.07)',
            borderRadius: 20,
            padding: '28px 32px',
            border: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(10px)',
            flex: '0 0 auto',
          }}
        >
          <p style={{ fontSize: 'clamp(18px, 3vw, 26px)', fontWeight: 700, color: '#FFFFFF', margin: 0, lineHeight: 1.5 }}>
            {question.text}
          </p>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={`choices-${game.currentQuestionIndex}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 12,
            flex: 1,
          }}
        >
          {question.choices.map((choice, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.07, type: 'spring', stiffness: 300, damping: 22 }}
              style={{
                borderRadius: 16,
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                background: CHOICE_COLORS[i].bg,
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
              }}
            >
              <div
                style={{
                  flexShrink: 0,
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  fontWeight: 800,
                  color: '#fff',
                }}
              >
                {CHOICE_LABELS[i]}
              </div>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#fff', lineHeight: 1.35 }}>
                {choice}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* All-answered banner */}
      <AnimatePresence>
        {allAnsweredCountdown !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 12 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            style={{
              background: 'linear-gradient(135deg, rgba(34,197,94,0.25) 0%, rgba(16,185,129,0.2) 100%)',
              border: '1px solid rgba(34,197,94,0.5)',
              borderRadius: 16,
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              style={{
                width: 40, height: 40, borderRadius: 10,
                background: '#22C55E',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#4ADE80' }}>
                Everyone answered!
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
                Moving to results in {allAnsweredCountdown}...
              </div>
            </div>
            <motion.div
              key={allAnsweredCountdown}
              initial={{ scale: 1.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              style={{ fontSize: 32, fontWeight: 800, color: '#4ADE80', minWidth: 32, textAlign: 'center' }}
            >
              {allAnsweredCountdown}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{ display: 'flex', gap: 12 }}
      >
        <MagnetizeButton
          onClick={handleShowLeaderboard}
          disabled={advancing}
          whileHover={!advancing ? { scale: 1.02, y: -1 } : {}}
          whileTap={!advancing ? { scale: 0.98 } : {}}
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 14,
            padding: '16px',
            color: '#fff',
            fontSize: 15,
            fontWeight: 700,
            cursor: advancing ? 'not-allowed' : 'pointer',
            opacity: advancing ? 0.6 : 1,
            fontFamily: 'inherit',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Show Results
        </MagnetizeButton>
        <MagnetizeButton
          onClick={handleEndGame}
          disabled={advancing}
          whileHover={!advancing ? { scale: 1.02, y: -1 } : {}}
          whileTap={!advancing ? { scale: 0.98 } : {}}
          particleColor="rgba(252,165,165,0.7)"
          style={{
            background: 'rgba(239,68,68,0.2)',
            border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: 14,
            padding: '16px 20px',
            color: '#FCA5A5',
            fontSize: 14,
            fontWeight: 700,
            cursor: advancing ? 'not-allowed' : 'pointer',
            opacity: advancing ? 0.6 : 1,
            fontFamily: 'inherit',
            whiteSpace: 'nowrap',
          }}
        >
          End Game
        </MagnetizeButton>
      </motion.div>
    </div>
  );
}
