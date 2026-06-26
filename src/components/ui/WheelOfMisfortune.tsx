import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type WheelOutcome = 'lose25' | 'lose50' | 'lose100' | 'lose250' | 'skip';

interface WheelOfMisfortuneProps {
  playerScore: number;
  onComplete: (outcome: WheelOutcome, penaltyAmount: number) => void;
}

const SEGMENTS: Array<{ type: WheelOutcome }> = [
  { type: 'lose25'  },
  { type: 'lose100' },
  { type: 'lose50'  },
  { type: 'lose250' },
  { type: 'skip'    },
  { type: 'lose25'  },
  { type: 'lose100' },
  { type: 'lose50'  },
  { type: 'lose250' },
  { type: 'lose50'  },
];

const SEG_CONFIG: Record<WheelOutcome, { label: string; sub: string; bg: string; glow: string; resultGradient: string }> = {
  lose25:  { label: '-25%',  sub: 'คะแนน',  bg: 'linear-gradient(160deg, #C2410C 0%, #F97316 100%)', glow: 'rgba(249,115,22,0.7)',   resultGradient: 'linear-gradient(135deg, #7C2D12, #EA580C)' },
  lose50:  { label: '-50%',  sub: 'คะแนน',  bg: 'linear-gradient(160deg, #991B1B 0%, #EF4444 100%)', glow: 'rgba(239,68,68,0.7)',    resultGradient: 'linear-gradient(135deg, #7F1D1D, #DC2626)' },
  lose100: { label: '-100',  sub: 'คะแนน',  bg: 'linear-gradient(160deg, #1E3A8A 0%, #3B82F6 100%)', glow: 'rgba(59,130,246,0.7)',   resultGradient: 'linear-gradient(135deg, #1E3A8A, #2563EB)' },
  lose250: { label: '-250',  sub: 'คะแนน',  bg: 'linear-gradient(160deg, #701A75 0%, #D946EF 100%)', glow: 'rgba(217,70,239,0.7)',   resultGradient: 'linear-gradient(135deg, #701A75, #A21CAF)' },
  skip:    { label: 'SKIP!', sub: 'ข้ามคำถาม', bg: 'linear-gradient(160deg, #4C1D95 0%, #8B5CF6 100%)', glow: 'rgba(139,92,246,0.7)', resultGradient: 'linear-gradient(135deg, #4C1D95, #7C3AED)' },
};

const CARD_W = 148;
const CARD_H = 196;
const CARD_GAP = 14;
const CARD_UNIT = CARD_W + CARD_GAP;
const PASSES = 3; // full cycles before the winning card lands

export default function WheelOfMisfortune({ playerScore, onComplete }: WheelOfMisfortuneProps) {
  const [targetIdx] = useState(() => Math.floor(Math.random() * SEGMENTS.length));
  const [phase, setPhase] = useState<'pre' | 'spinning' | 'result'>('pre');
  const [screenW, setScreenW] = useState(() => window.innerWidth);

  useEffect(() => {
    const handler = () => setScreenW(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const outcome = SEGMENTS[targetIdx];
  const cfg = SEG_CONFIG[outcome.type];

  const base = Math.max(0, playerScore);
  const penalty =
    outcome.type === 'skip'    ? 0
    : outcome.type === 'lose25'  ? Math.floor(base * 0.25)
    : outcome.type === 'lose50'  ? Math.floor(base * 0.50)
    : outcome.type === 'lose100' ? 100
    : 250;

  // Absolute index of the winning card in the full card array
  const absTarget = PASSES * SEGMENTS.length + targetIdx;
  const totalCards = absTarget + 5;
  const cards = Array.from({ length: totalCards }, (_, i) => SEGMENTS[i % SEGMENTS.length]);

  // Start: card strip begins off-screen to the right
  const startX = screenW + 60;
  // End: winning card is centered on screen
  const endX = screenW / 2 - absTarget * CARD_UNIT - CARD_W / 2;

  useEffect(() => {
    const t = setTimeout(() => setPhase('spinning'), 500);
    return () => clearTimeout(t);
  }, []);

  function handleStripComplete() {
    if (phase === 'spinning') setPhase('result');
  }

  useEffect(() => {
    if (phase !== 'result') return;
    const t = setTimeout(() => onComplete(outcome.type, penalty), 2800);
    return () => clearTimeout(t);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const resultTitle =
    outcome.type === 'skip'    ? 'ข้ามคำถามถัดไป!' :
    outcome.type === 'lose25'  ? 'เสีย 25% คะแนน' :
    outcome.type === 'lose50'  ? 'เสีย 50% คะแนน!!' :
    outcome.type === 'lose100' ? 'เสีย 100 คะแนน!' :
                                 'เสีย 250 คะแนน!!';

  const resultSub =
    outcome.type === 'skip' ? 'ไม่สามารถตอบคำถามต่อไปได้'
    : penalty > 0 ? `-${penalty.toLocaleString()} คะแนน`
    : 'โชคดีไม่มีคะแนนเสีย';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.94)',
        backdropFilter: 'blur(10px)',
        gap: 32,
      }}
    >
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 22 }}
        style={{
          fontSize: 18, fontWeight: 900, color: '#FF4444',
          letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center',
        }}
      >
        <motion.span
          animate={{ scale: [1, 1.04, 1], textShadow: ['0 0 18px rgba(255,80,80,0.7)', '0 0 32px rgba(255,80,80,1)', '0 0 18px rgba(255,80,80,0.7)'] }}
          transition={{ duration: 1.4, repeat: Infinity, repeatType: 'mirror' }}
          style={{ display: 'inline-block' }}
        >
          🎰 วงล้อแห่งโชคร้าย
        </motion.span>
      </motion.div>

      {/* Slot track */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: CARD_H + 32,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {/* Scrolling card strip */}
        <motion.div
          style={{
            display: 'flex',
            gap: CARD_GAP,
            position: 'absolute',
            top: '50%',
            translateY: '-50%',
            x: startX,
          }}
          animate={phase !== 'pre' ? { x: endX } : {}}
          transition={
            phase === 'spinning'
              ? { duration: 3.8, ease: [0.08, 0.82, 0.17, 1] }
              : { duration: 0 }
          }
          onAnimationComplete={handleStripComplete}
        >
          {cards.map((seg, i) => {
            const c = SEG_CONFIG[seg.type];
            const isWinner = phase === 'result' && i === absTarget;
            return (
              <motion.div
                key={i}
                animate={isWinner ? { scale: [1, 1.1, 1.05], y: [0, -8, -4] } : {}}
                transition={{ duration: 0.5, delay: 0.1 }}
                style={{
                  width: CARD_W,
                  height: CARD_H,
                  borderRadius: 22,
                  background: c.bg,
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  boxShadow: isWinner
                    ? `0 0 0 3px rgba(255,255,255,0.9), 0 0 60px ${c.glow}, 0 8px 32px rgba(0,0,0,0.5)`
                    : '0 4px 20px rgba(0,0,0,0.4)',
                  filter: (!isWinner && phase === 'result') ? 'brightness(0.45)' : 'none',
                  transition: 'filter 0.4s',
                }}
              >
                <span
                  style={{
                    fontSize: seg.type === 'skip' ? 28 : 36,
                    fontWeight: 900,
                    color: '#fff',
                    letterSpacing: seg.type === 'skip' ? 0 : -1,
                    lineHeight: 1,
                    fontFamily: 'inherit',
                  }}
                >
                  {c.label}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.72)',
                    letterSpacing: '0.5px',
                  }}
                >
                  {c.sub}
                </span>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Left fade */}
        <div
          style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: 140,
            background: 'linear-gradient(90deg, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.7) 60%, transparent 100%)',
            zIndex: 10, pointerEvents: 'none',
          }}
        />
        {/* Right fade */}
        <div
          style={{
            position: 'absolute', right: 0, top: 0, bottom: 0,
            width: 140,
            background: 'linear-gradient(270deg, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.7) 60%, transparent 100%)',
            zIndex: 10, pointerEvents: 'none',
          }}
        />

        {/* Center selection frame */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: CARD_W + 12,
            height: CARD_H + 12,
            borderRadius: 26,
            border: '2.5px solid rgba(255,255,255,0.28)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.08) inset',
            zIndex: 11,
            pointerEvents: 'none',
          }}
        />

        {/* Top/bottom arrows pointing inward at center */}
        <div
          style={{
            position: 'absolute', left: '50%', top: 4,
            transform: 'translateX(-50%)',
            zIndex: 12, pointerEvents: 'none',
            width: 0, height: 0,
            borderLeft: '9px solid transparent',
            borderRight: '9px solid transparent',
            borderTop: '16px solid rgba(255,255,255,0.55)',
          }}
        />
        <div
          style={{
            position: 'absolute', left: '50%', bottom: 4,
            transform: 'translateX(-50%)',
            zIndex: 12, pointerEvents: 'none',
            width: 0, height: 0,
            borderLeft: '9px solid transparent',
            borderRight: '9px solid transparent',
            borderBottom: '16px solid rgba(255,255,255,0.55)',
          }}
        />
      </div>

      {/* Status / result */}
      <AnimatePresence mode="wait">
        {phase !== 'result' ? (
          <motion.div
            key="spinning"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, repeat: Infinity }}
            style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.5)' }}
          >
            {phase === 'pre' ? 'กำลังเตรียม...' : 'กำลังหมุน...'}
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 24, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 340, damping: 22, delay: 0.1 }}
            style={{
              background: cfg.resultGradient,
              borderRadius: 20,
              padding: '18px 36px',
              textAlign: 'center',
              boxShadow: `0 10px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.12) inset`,
              minWidth: 220,
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 0.5, repeat: 2 }}
              style={{ fontSize: 17, fontWeight: 900, color: '#fff', marginBottom: 6 }}
            >
              {resultTitle}
            </motion.div>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'rgba(255,255,255,0.92)' }}>
              {resultSub}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
