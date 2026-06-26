import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  subscribeToPlayers,
  subscribeToGame,
  nextQuestion,
  endGame,
} from '../firebase/gameService';
import { QUESTIONS } from '../data/questions';
import { formatScore } from '../lib/scoring';
import { CHOICE_LABELS } from '../lib/utils';
import type { Player, Game } from '../types';
import MotionButton from '../components/ui/Button';

interface LeaderboardPageProps {
  gameCode: string;
  isHost: boolean;
  playerId?: string;
  onNextQuestion: () => void;
  onGameFinished: () => void;
}

const RANK_CONFIG = [
  { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', badge: '#F59E0B', label: '1st' },
  { bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.22)', badge: '#94A3B8', label: '2nd' },
  { bg: 'rgba(180,100,40,0.13)', border: 'rgba(205,124,52,0.25)', badge: '#CD7C34', label: '3rd' },
];

export default function LeaderboardPage({
  gameCode,
  isHost,
  onNextQuestion,
  onGameFinished,
}: LeaderboardPageProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [game, setGame] = useState<Game | null>(null);
  const [advancing, setAdvancing] = useState(false);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [wheelCooldown, setWheelCooldown] = useState(8);

  const handleNext = useCallback(onNextQuestion, []);
  const handleFinish = useCallback(onGameFinished, []);

  useEffect(() => {
    const unsub = subscribeToPlayers(gameCode, setPlayers);
    return unsub;
  }, [gameCode]);

  useEffect(() => {
    const unsub = subscribeToGame(gameCode, (g) => {
      setGame(g);
      if (!g) return;
      if (g.status === 'question') handleNext();
      if (g.status === 'finished') handleFinish();
    });
    return unsub;
  }, [gameCode, handleNext, handleFinish]);

  useEffect(() => {
    const t = setTimeout(() => setShowCorrectAnswer(true), 350);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!isHost) return;
    setWheelCooldown(8);
    const interval = setInterval(() => {
      setWheelCooldown((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isHost]);

  async function handleNextQuestion() {
    if (!game || advancing) return;
    setAdvancing(true);
    try {
      await nextQuestion(gameCode, game.currentQuestionIndex);
    } finally {
      setAdvancing(false);
    }
  }

  async function handleEndGame() {
    if (advancing) return;
    setAdvancing(true);
    try {
      await endGame(gameCode);
    } finally {
      setAdvancing(false);
    }
  }

  const isLastQuestion = game ? game.currentQuestionIndex >= QUESTIONS.length - 1 : false;
  const currentQuestion = game ? QUESTIONS[game.currentQuestionIndex] : null;
  const correctChoice = currentQuestion ? currentQuestion.choices[currentQuestion.correctIndex] : null;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        padding: '28px 20px',
        gap: 16,
        boxSizing: 'border-box',
        maxWidth: 600,
        margin: '0 auto',
        width: '100%',
      }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        style={{ paddingTop: 8 }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <h2
            style={{
              fontSize: 'clamp(24px, 5vw, 34px)',
              fontWeight: 900,
              color: '#fff',
              margin: 0,
              letterSpacing: '-0.5px',
            }}
          >
            ลีดเดอร์บอร์ด
          </h2>
          {game && (
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.35)',
                letterSpacing: '0.5px',
              }}
            >
              ข้อ {game.currentQuestionIndex + 1} / {game.totalQuestions}
            </span>
          )}
        </div>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: 'linear-gradient(90deg, rgba(99,102,241,0.5), rgba(168,85,247,0.3), transparent)',
            marginTop: 14,
          }}
        />
      </motion.div>

      {/* Correct answer banner */}
      <AnimatePresence>
        {showCorrectAnswer && correctChoice && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            style={{
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.25)',
              borderRadius: 14,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            <motion.div
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 500, damping: 18 }}
              style={{
                flexShrink: 0,
                width: 28,
                height: 28,
                borderRadius: 7,
                background: 'rgba(34,197,94,0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#4ADE80', marginBottom: 4, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                คำตอบที่ถูกต้อง
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', lineHeight: 1.45 }}>
                {CHOICE_LABELS[currentQuestion!.correctIndex]}. {correctChoice}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Player list */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0, overflow: 'hidden' }}>
        {players.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>
            ไม่มีผู้เล่น
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', flex: 1 }}>
            <AnimatePresence initial={false}>
              {players.map((player, index) => {
                const rank = RANK_CONFIG[index];
                return (
                  <motion.div
                    key={player.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{
                      layout: { type: 'spring', stiffness: 300, damping: 26 },
                      opacity: { duration: 0.25 },
                      delay: Math.min(index * 0.04, 0.25),
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      background: rank ? rank.bg : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${rank ? rank.border : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: 14,
                      padding: '12px 16px',
                    }}
                  >
                    {/* Rank badge */}
                    <motion.div
                      animate={index < 3 ? { scale: [1, 1.12, 1] } : {}}
                      transition={{ duration: 0.45, delay: index * 0.08 + 0.3 }}
                      style={{
                        flexShrink: 0,
                        width: 36,
                        height: 36,
                        borderRadius: 9,
                        background: rank ? rank.badge : 'rgba(255,255,255,0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: rank ? 12 : 13,
                        fontWeight: 800,
                        color: rank ? '#fff' : 'rgba(255,255,255,0.5)',
                      }}
                    >
                      {rank ? rank.label : `#${index + 1}`}
                    </motion.div>

                    {/* Avatar */}
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 9,
                        background: `hsl(${(player.nickname.charCodeAt(0) * 47) % 360}, 58%, 48%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        fontWeight: 800,
                        color: '#fff',
                        flexShrink: 0,
                      }}
                    >
                      {player.nickname.charAt(0).toUpperCase()}
                    </div>

                    {/* Name */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: '#fff',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {player.nickname}
                      </div>
                    </div>

                    {/* Score */}
                    <motion.div
                      key={player.score}
                      initial={{ scale: 1.2, color: '#818CF8' }}
                      animate={{ scale: 1, color: '#fff' }}
                      transition={{ type: 'spring', stiffness: 380, damping: 16 }}
                      style={{
                        fontSize: 17,
                        fontWeight: 800,
                        color: '#fff',
                        flexShrink: 0,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {formatScore(player.score)}
                    </motion.div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Host controls */}
      {isHost && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.35 }}
          style={{ display: 'flex', gap: 10, paddingBottom: 8 }}
        >
          {!isLastQuestion ? (
            <>
              <MotionButton
                onClick={handleNextQuestion}
                loading={advancing}
                disabled={advancing || wheelCooldown > 0}
                fullWidth
                size="lg"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18l6-6-6-6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {wheelCooldown > 0 ? `ข้อถัดไป (${wheelCooldown}s)` : 'ข้อถัดไป'}
              </MotionButton>
              <motion.button
                onClick={handleEndGame}
                disabled={advancing}
                whileHover={!advancing ? { scale: 1.02, y: -1 } : {}}
                whileTap={!advancing ? { scale: 0.97 } : {}}
                style={{
                  background: 'rgba(239,68,68,0.12)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 14,
                  padding: '16px 18px',
                  color: '#FCA5A5',
                  fontSize: 14,
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
            </>
          ) : (
            <MotionButton
              onClick={handleEndGame}
              loading={advancing}
              disabled={advancing}
              fullWidth
              size="lg"
              variant="danger"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              แสดงผลสรุปสุดท้าย
            </MotionButton>
          )}
        </motion.div>
      )}

      {/* Player waiting state */}
      {!isHost && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{ textAlign: 'center', padding: '10px 0 8px' }}
        >
          <motion.div
            animate={{ opacity: [0.45, 1, 0.45] }}
            transition={{ duration: 2.2, repeat: Infinity }}
            style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.4)',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
            }}
          >
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22C55E' }} />
            รอผู้จัดข้อถัดไป...
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
