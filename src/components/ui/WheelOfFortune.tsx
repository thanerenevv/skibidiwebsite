import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Player } from '../../types';

export type FortuneOutcome =
  | 'plus100' | 'plus250' | 'plus500' | 'plus1000'
  | 'plus25pct' | 'double'
  | 'steal25' | 'steal50'
  | 'immunity' | 'lucky777';

interface WheelOfFortuneProps {
  playerScore: number;
  playerId: string;
  players: Player[];
  onComplete: (outcome: FortuneOutcome, bonusAmount: number, victimId?: string) => void;
}

const SEGMENTS: Array<{ type: FortuneOutcome }> = [
  { type: 'plus100'   },
  { type: 'steal25'   },
  { type: 'plus250'   },
  { type: 'plus500'   },
  { type: 'immunity'  },
  { type: 'plus25pct' },
  { type: 'steal50'   },
  { type: 'lucky777'  },
  { type: 'double'    },
  { type: 'plus1000'  },
];

const SEG_CONFIG: Record<FortuneOutcome, {
  label: string;
  border: string;
  labelColor: string;
  glow: string;
  resultColor: string;
}> = {
  plus100:   { label: '+100',  border: '#22C55E', labelColor: '#15803D', glow: 'rgba(34,197,94,0.55)',   resultColor: '#16A34A' },
  plus250:   { label: '+250',  border: '#3B82F6', labelColor: '#1D4ED8', glow: 'rgba(59,130,246,0.55)',  resultColor: '#1D4ED8' },
  plus500:   { label: '+500',  border: '#8B5CF6', labelColor: '#6D28D9', glow: 'rgba(139,92,246,0.55)',  resultColor: '#6D28D9' },
  plus1000:  { label: '+1000', border: '#EAB308', labelColor: '#713F12', glow: 'rgba(234,179,8,0.65)',   resultColor: '#92400E' },
  plus25pct: { label: '+25%',  border: '#10B981', labelColor: '#065F46', glow: 'rgba(16,185,129,0.55)',  resultColor: '#047857' },
  double:    { label: '×2',    border: '#EC4899', labelColor: '#831843', glow: 'rgba(236,72,153,0.55)',  resultColor: '#9D174D' },
  steal25:   { label: '',      border: '#F59E0B', labelColor: '#92400E', glow: 'rgba(245,158,11,0.55)',  resultColor: '#92400E' },
  steal50:   { label: '',      border: '#EF4444', labelColor: '#7F1D1D', glow: 'rgba(239,68,68,0.55)',   resultColor: '#991B1B' },
  immunity:  { label: 'SHIELD',border: '#06B6D4', labelColor: '#164E63', glow: 'rgba(6,182,212,0.55)',   resultColor: '#0E7490' },
  lucky777:  { label: '777!',  border: '#F97316', labelColor: '#7C2D12', glow: 'rgba(249,115,22,0.55)',  resultColor: '#C2410C' },
};

const CARD_W = 148;
const CARD_H = 196;
const CARD_GAP = 14;
const CARD_UNIT = CARD_W + CARD_GAP;
const PASSES = 3;

export default function WheelOfFortune({ playerScore, playerId, players, onComplete }: WheelOfFortuneProps) {
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

  // Find the top-scoring other player (for steal outcomes)
  const topPlayer = players
    .filter(p => p.id !== playerId && !p.left)
    .sort((a, b) => b.score - a.score)[0] ?? null;

  const base = Math.max(0, playerScore);
  const stealBase = Math.max(0, topPlayer?.score ?? 0);

  const bonus =
    outcome.type === 'plus100'   ? 100 :
    outcome.type === 'plus250'   ? 250 :
    outcome.type === 'plus500'   ? 500 :
    outcome.type === 'plus1000'  ? 1000 :
    outcome.type === 'lucky777'  ? 777 :
    outcome.type === 'plus25pct' ? Math.floor(base * 0.25) :
    outcome.type === 'double'    ? base :
    outcome.type === 'steal25'   ? Math.floor(stealBase * 0.25) :
    outcome.type === 'steal50'   ? Math.floor(stealBase * 0.50) :
    0; // immunity

  const victimId = (outcome.type === 'steal25' || outcome.type === 'steal50')
    ? topPlayer?.id
    : undefined;

  const absTarget = PASSES * SEGMENTS.length + targetIdx;
  const totalCards = absTarget + 5;
  const cards = Array.from({ length: totalCards }, (_, i) => SEGMENTS[i % SEGMENTS.length]);

  const startX = screenW + 60;
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
    const t = setTimeout(() => onComplete(outcome.type, bonus, victimId), 2800);
    return () => clearTimeout(t);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const isSteal = outcome.type === 'steal25' || outcome.type === 'steal50';
  const resultLine =
    outcome.type === 'immunity'  ? 'กันวงล้อโชคร้ายครั้งถัดไป!' :
    outcome.type === 'double'    ? `คะแนนคูณสอง! +${bonus.toLocaleString()}` :
    isSteal && (!victimId || bonus <= 0) ? 'ไม่มีเป้าหมายให้ขโมยคะแนน' :
    isSteal                      ? `ขโมย ${bonus.toLocaleString()} คะแนนจาก ${topPlayer?.nickname ?? ''}` :
    `+${bonus.toLocaleString()} คะแนน`;

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
        background: 'rgba(250,250,252,0.97)',
        backdropFilter: 'blur(10px)',
        gap: 32,
      }}
    >
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
            const isSteal = seg.type === 'steal25' || seg.type === 'steal50';
            return (
              <motion.div
                key={i}
                animate={isWinner ? { scale: [1, 1.1, 1.05], y: [0, -8, -4] } : {}}
                transition={{ duration: 0.5, delay: 0.1 }}
                style={{
                  width: CARD_W,
                  height: CARD_H,
                  borderRadius: 22,
                  background: '#ffffff',
                  border: `2px solid ${c.border}`,
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  boxShadow: isWinner
                    ? `0 0 0 3px ${c.border}, 0 0 60px ${c.glow}, 0 8px 32px rgba(0,0,0,0.15)`
                    : '0 4px 20px rgba(0,0,0,0.1)',
                  filter: (!isWinner && phase === 'result') ? 'brightness(0.55) saturate(0.3)' : 'none',
                  transition: 'filter 0.4s',
                }}
              >
                {isSteal ? (
                  <>
                    <span style={{ fontSize: 13, fontWeight: 800, color: c.labelColor, letterSpacing: 1 }}>STEAL</span>
                    <span style={{ fontSize: 34, fontWeight: 900, color: c.labelColor, lineHeight: 1 }}>
                      {seg.type === 'steal25' ? '25%' : '50%'}
                    </span>
                  </>
                ) : (
                  <span
                    style={{
                      fontSize: seg.type === 'plus1000' ? 28 : seg.type === 'immunity' ? 24 : 36,
                      fontWeight: 900,
                      color: c.labelColor,
                      letterSpacing: seg.type === 'double' ? 0 : -1,
                      lineHeight: 1,
                      fontFamily: 'inherit',
                    }}
                  >
                    {c.label}
                  </span>
                )}
              </motion.div>
            );
          })}
        </motion.div>

        {/* Left fade */}
        <div
          style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: 140,
            background: 'linear-gradient(90deg, rgba(250,250,252,0.97) 0%, rgba(250,250,252,0.7) 60%, transparent 100%)',
            zIndex: 10, pointerEvents: 'none',
          }}
        />
        {/* Right fade */}
        <div
          style={{
            position: 'absolute', right: 0, top: 0, bottom: 0,
            width: 140,
            background: 'linear-gradient(270deg, rgba(250,250,252,0.97) 0%, rgba(250,250,252,0.7) 60%, transparent 100%)',
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
            border: '2.5px solid rgba(0,0,0,0.18)',
            zIndex: 11,
            pointerEvents: 'none',
          }}
        />

        {/* Top/bottom arrows */}
        <div
          style={{
            position: 'absolute', left: '50%', top: 4,
            transform: 'translateX(-50%)',
            zIndex: 12, pointerEvents: 'none',
            width: 0, height: 0,
            borderLeft: '9px solid transparent',
            borderRight: '9px solid transparent',
            borderTop: '16px solid rgba(0,0,0,0.35)',
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
            borderBottom: '16px solid rgba(0,0,0,0.35)',
          }}
        />
      </div>

      {/* Result */}
      <AnimatePresence mode="wait">
        {phase === 'result' ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: cfg.resultColor,
              textAlign: 'center',
              letterSpacing: 0.5,
            }}
          >
            {resultLine}
          </motion.div>
        ) : (
          <motion.div
            key="spinning"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, repeat: Infinity }}
            style={{ fontSize: 14, fontWeight: 500, color: 'rgba(15,23,42,0.45)' }}
          >
            {phase === 'pre' ? 'กำลังเตรียม...' : 'กำลังหมุน...'}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
