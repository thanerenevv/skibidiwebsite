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

const SEG_CONFIG: Record<WheelOutcome, { label: string; border: string; labelColor: string; glow: string; resultColor: string }> = {
  lose25:  { label: '-25%',  border: '#F97316', labelColor: '#FB923C', glow: 'rgba(249,115,22,0.6)',  resultColor: '#FB923C' },
  lose50:  { label: '-50%',  border: '#EF4444', labelColor: '#F87171', glow: 'rgba(239,68,68,0.6)',   resultColor: '#F87171' },
  lose100: { label: '-100',  border: '#3B82F6', labelColor: '#60A5FA', glow: 'rgba(59,130,246,0.6)',  resultColor: '#60A5FA' },
  lose250: { label: '-250',  border: '#D946EF', labelColor: '#E879F9', glow: 'rgba(217,70,239,0.6)',  resultColor: '#E879F9' },
  skip:    { label: 'SKIP!', border: '#8B5CF6', labelColor: '#A78BFA', glow: 'rgba(139,92,246,0.6)', resultColor: '#A78BFA' },
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

  const resultLine =
    outcome.type === 'skip'    ? 'SKIP next question'
    : penalty > 0              ? `-${penalty.toLocaleString()} points`
    :                            'No penalty';

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
        background: 'rgba(5,5,5,0.97)',
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
            return (
              <motion.div
                key={i}
                animate={isWinner ? { scale: [1, 1.1, 1.05], y: [0, -8, -4] } : {}}
                transition={{ duration: 0.5, delay: 0.1 }}
                style={{
                  width: CARD_W,
                  height: CARD_H,
                  borderRadius: 22,
                  background: '#0a0a0a',
                  border: `2px solid ${c.border}`,
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  boxShadow: isWinner
                    ? `0 0 0 3px ${c.border}, 0 0 60px ${c.glow}, 0 8px 32px rgba(0,0,0,0.8)`
                    : '0 4px 20px rgba(0,0,0,0.6)',
                  filter: (!isWinner && phase === 'result') ? 'brightness(0.3)' : 'none',
                  transition: 'filter 0.4s',
                }}
              >
                <span
                  style={{
                    fontSize: seg.type === 'skip' ? 26 : 36,
                    fontWeight: 900,
                    color: c.labelColor,
                    letterSpacing: seg.type === 'skip' ? 0 : -1,
                    lineHeight: 1,
                    fontFamily: 'inherit',
                  }}
                >
                  {c.label}
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

      {/* Result */}
      <AnimatePresence mode="wait">
        {phase === 'result' && (
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
        )}
      </AnimatePresence>
    </motion.div>
  );
}
