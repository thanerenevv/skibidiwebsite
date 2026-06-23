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
import { MagnetizeButton } from '@/components/ui/magnetize-button';

interface LeaderboardPageProps {
  gameCode: string;
  isHost: boolean;
  playerId?: string;
  onNextQuestion: () => void;
  onGameFinished: () => void;
}

const MEDAL_COLORS = ['#F59E0B', '#94A3B8', '#CD7C34'];
const MEDAL_LABELS = ['1st', '2nd', '3rd'];

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
    const t = setTimeout(() => setShowCorrectAnswer(true), 400);
    return () => clearTimeout(t);
  }, []);

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
  const correctChoice = currentQuestion
    ? currentQuestion.choices[currentQuestion.correctIndex]
    : null;

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
        style={{ textAlign: 'center', paddingTop: 8 }}
      >
        <h2
          style={{
            fontSize: 'clamp(22px, 4vw, 32px)',
            fontWeight: 800,
            color: '#FFFFFF',
            margin: '0 0 4px',
          }}
        >
          ลีดเดอร์บอร์ด
        </h2>
        {game && (
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: 0, fontWeight: 600 }}>
            หลังข้อที่ {game.currentQuestionIndex + 1} / {game.totalQuestions}
          </p>
        )}
      </motion.div>

      <AnimatePresence>
        {showCorrectAnswer && correctChoice && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            style={{
              background: 'linear-gradient(135deg, rgba(34,197,94,0.2) 0%, rgba(16,185,129,0.15) 100%)',
              border: '1px solid rgba(34,197,94,0.4)',
              borderRadius: 16,
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 500, damping: 15 }}
              style={{
                flexShrink: 0,
                width: 32,
                height: 32,
                borderRadius: 8,
                background: '#22C55E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#4ADE80', marginBottom: 4, letterSpacing: '0.5px' }}>
                คำตอบที่ถูกต้อง
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#FFFFFF', lineHeight: 1.4 }}>
                {CHOICE_LABELS[currentQuestion!.correctIndex]}. {correctChoice}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>
        {players.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>
            ไม่มีผู้เล่น
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', flex: 1 }}>
            <AnimatePresence initial={false}>
              {players.map((player, index) => (
                <motion.div
                  key={player.id}
                  layout
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={{
                    layout: { type: 'spring', stiffness: 280, damping: 24 },
                    opacity: { duration: 0.3 },
                    delay: index * 0.05,
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    background:
                      index === 0
                        ? 'linear-gradient(135deg, rgba(245,158,11,0.25) 0%, rgba(251,191,36,0.15) 100%)'
                        : index === 1
                        ? 'linear-gradient(135deg, rgba(148,163,184,0.2) 0%, rgba(203,213,225,0.1) 100%)'
                        : index === 2
                        ? 'linear-gradient(135deg, rgba(205,124,52,0.2) 0%, rgba(180,100,40,0.1) 100%)'
                        : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${
                      index === 0
                        ? 'rgba(245,158,11,0.35)'
                        : index === 1
                        ? 'rgba(148,163,184,0.25)'
                        : index === 2
                        ? 'rgba(205,124,52,0.3)'
                        : 'rgba(255,255,255,0.1)'
                    }`,
                    borderRadius: 16,
                    padding: '14px 18px',
                  }}
                >
                  <motion.div
                    animate={index < 3 ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                    style={{
                      flexShrink: 0,
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background:
                        index < 3 ? MEDAL_COLORS[index] : 'rgba(255,255,255,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: index < 3 ? 13 : 16,
                      fontWeight: 800,
                      color: '#fff',
                    }}
                  >
                    {index < 3 ? MEDAL_LABELS[index] : `#${index + 1}`}
                  </motion.div>

                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: `hsl(${(player.nickname.charCodeAt(0) * 47) % 360}, 60%, 50%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 15,
                      fontWeight: 800,
                      color: '#fff',
                      flexShrink: 0,
                    }}
                  >
                    {player.nickname.charAt(0).toUpperCase()}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: '#FFFFFF',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {player.nickname}
                    </div>
                  </div>

                  <motion.div
                    key={player.score}
                    initial={{ scale: 1.3, color: '#60A5FA' }}
                    animate={{ scale: 1, color: '#fff' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: '#FFFFFF',
                      flexShrink: 0,
                    }}
                  >
                    {formatScore(player.score)}
                  </motion.div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {isHost && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ display: 'flex', gap: 12, paddingBottom: 8 }}
        >
          {!isLastQuestion ? (
            <>
              <MotionButton
                onClick={handleNextQuestion}
                loading={advancing}
                disabled={advancing}
                fullWidth
                size="lg"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18l6-6-6-6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                ข้อถัดไป
              </MotionButton>
              <MagnetizeButton
                onClick={handleEndGame}
                disabled={advancing}
                whileHover={!advancing ? { scale: 1.03, y: -1 } : {}}
                whileTap={!advancing ? { scale: 0.97 } : {}}
                particleColor="rgba(252,165,165,0.7)"
                style={{
                  background: 'rgba(239,68,68,0.2)',
                  border: '1px solid rgba(239,68,68,0.4)',
                  borderRadius: 14,
                  padding: '18px 20px',
                  color: '#FCA5A5',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: advancing ? 'not-allowed' : 'pointer',
                  opacity: advancing ? 0.6 : 1,
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                }}
              >
                จบเกม
              </MagnetizeButton>
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              แสดงผลสรุปสุดท้าย
            </MotionButton>
          )}
        </motion.div>
      )}

      {!isHost && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            textAlign: 'center',
            padding: '12px',
          }}
        >
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              fontSize: 14,
              color: 'rgba(255,255,255,0.5)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E' }} />
            รอผู้จัดข้อถัดไป...
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
