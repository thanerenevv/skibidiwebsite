import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type WheelOutcome = 'lose25' | 'lose50' | 'skip';

interface WheelOfMisfortuneProps {
  playerScore: number;
  onComplete: (outcome: WheelOutcome, penaltyAmount: number) => void;
}

const SEG_COUNT = 10;
const ANGLE_STEP = 360 / SEG_COUNT;
const CX = 140;
const CY = 140;
const R = 108;
const LABEL_R = 70;

const SEGMENTS: Array<{ label: string; type: WheelOutcome; color: string; stroke: string }> = [
  { label: '-25%',  type: 'lose25', color: '#E05500', stroke: '#FF7A30' },
  { label: '-50%',  type: 'lose50', color: '#991B1B', stroke: '#C02020' },
  { label: '-25%',  type: 'lose25', color: '#FF6B00', stroke: '#FF8C40' },
  { label: '-50%',  type: 'lose50', color: '#B91C1C', stroke: '#DC2626' },
  { label: 'SKIP!', type: 'skip',   color: '#5B21B6', stroke: '#7C3AED' },
  { label: '-25%',  type: 'lose25', color: '#E05500', stroke: '#FF7A30' },
  { label: '-50%',  type: 'lose50', color: '#991B1B', stroke: '#C02020' },
  { label: '-25%',  type: 'lose25', color: '#FF6B00', stroke: '#FF8C40' },
  { label: '-50%',  type: 'lose50', color: '#B91C1C', stroke: '#DC2626' },
  { label: '-50%',  type: 'lose50', color: '#7F1D1D', stroke: '#B91C1C' },
];

function slicePath(startDeg: number, endDeg: number): string {
  const toRad = (d: number) => (d - 90) * (Math.PI / 180);
  const x1 = CX + R * Math.cos(toRad(startDeg));
  const y1 = CY + R * Math.sin(toRad(startDeg));
  const x2 = CX + R * Math.cos(toRad(endDeg));
  const y2 = CY + R * Math.sin(toRad(endDeg));
  return `M ${CX} ${CY} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
}

function labelPos(i: number) {
  const midDeg = i * ANGLE_STEP + ANGLE_STEP / 2;
  const rad = (midDeg - 90) * (Math.PI / 180);
  return {
    x: CX + LABEL_R * Math.cos(rad),
    y: CY + LABEL_R * Math.sin(rad),
    rotate: midDeg > 90 && midDeg < 270 ? midDeg + 180 : midDeg,
  };
}

export default function WheelOfMisfortune({ playerScore, onComplete }: WheelOfMisfortuneProps) {
  const [targetIdx] = useState(() => Math.floor(Math.random() * SEG_COUNT));
  const [phase, setPhase] = useState<'pre' | 'spinning' | 'result'>('pre');

  const outcome = SEGMENTS[targetIdx];
  const penalty =
    outcome.type === 'skip' ? 0
    : outcome.type === 'lose25' ? Math.floor(playerScore * 0.25)
    : Math.floor(playerScore * 0.50);

  // 7 full rotations + land on center of target segment
  const finalRotation = 7 * 360 + targetIdx * ANGLE_STEP + ANGLE_STEP / 2;

  useEffect(() => {
    const t = setTimeout(() => setPhase('spinning'), 600);
    return () => clearTimeout(t);
  }, []);

  function handleSpinComplete() {
    if (phase === 'spinning') setPhase('result');
  }

  useEffect(() => {
    if (phase !== 'result') return;
    const t = setTimeout(() => onComplete(outcome.type, penalty), 3000);
    return () => clearTimeout(t);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const resultTitle =
    outcome.type === 'skip' ? 'ข้ามคำถามถัดไป!' :
    outcome.type === 'lose25' ? 'เสีย 25% คะแนน' : 'เสีย 50% คะแนน!!';

  const resultSub =
    outcome.type === 'skip' ? 'คุณจะไม่สามารถตอบคำถามต่อไปได้'
    : penalty > 0 ? `-${penalty.toLocaleString()} คะแนน`
    : 'โชคดีไม่มีคะแนนเสีย';

  const resultGradient =
    outcome.type === 'skip'
      ? 'linear-gradient(135deg, #4C1D95, #7C3AED)'
      : 'linear-gradient(135deg, #7F1D1D, #DC2626)';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.92)',
        backdropFilter: 'blur(8px)',
        padding: '20px',
      }}
    >
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 24, delay: 0.08 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          width: '100%',
          maxWidth: 340,
        }}
      >
        {/* Title */}
        <motion.div
          animate={{ scale: [1, 1.04, 1], textShadow: ['0 0 18px rgba(255,80,80,0.7)', '0 0 32px rgba(255,80,80,1)', '0 0 18px rgba(255,80,80,0.7)'] }}
          transition={{ duration: 1.4, repeat: Infinity, repeatType: 'mirror' }}
          style={{
            fontSize: 18,
            fontWeight: 900,
            color: '#FF4444',
            letterSpacing: 2,
            textTransform: 'uppercase',
            textAlign: 'center',
          }}
        >
          🎡 WHEEL OF MISFORTUNE
        </motion.div>

        {/* Wheel + pointer wrapper */}
        <div style={{ position: 'relative', width: 280, height: 280 }}>
          {/* Fixed pointer */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            width: 0,
            height: 0,
            borderLeft: '13px solid transparent',
            borderRight: '13px solid transparent',
            borderTop: '26px solid #FFD700',
            filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.7)) drop-shadow(0 0 8px rgba(255,215,0,0.6))',
          }} />

          <svg viewBox="0 0 280 280" width={280} height={280} style={{ display: 'block' }}>
            <defs>
              <filter id="glow-ring">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>

            {/* Subtle outer glow */}
            <circle cx={CX} cy={CY} r={R + 10} fill="rgba(255,100,0,0.08)" />

            {/* Rotating group */}
            <motion.g
              style={{ transformOrigin: `${CX}px ${CY}px` } as React.CSSProperties}
              animate={{ rotate: phase !== 'pre' ? finalRotation : 0 }}
              transition={
                phase === 'spinning'
                  ? { duration: 5.5, ease: [0.13, 0.25, 0.06, 1.0] }
                  : { duration: 0 }
              }
              onAnimationComplete={handleSpinComplete}
            >
              {SEGMENTS.map((seg, i) => {
                const lp = labelPos(i);
                const isTarget = phase === 'result' && i === targetIdx;
                return (
                  <g key={i}>
                    <path
                      d={slicePath(i * ANGLE_STEP, (i + 1) * ANGLE_STEP)}
                      fill={isTarget ? seg.stroke : seg.color}
                      stroke="#060606"
                      strokeWidth={1.5}
                    />
                    <text
                      x={lp.x}
                      y={lp.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize={seg.label === 'SKIP!' ? 8.5 : 9.5}
                      fontWeight="800"
                      transform={`rotate(${lp.rotate}, ${lp.x.toFixed(2)}, ${lp.y.toFixed(2)})`}
                      style={{ fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: -0.3 }}
                    >
                      {seg.label}
                    </text>
                  </g>
                );
              })}

              {/* Divider lines */}
              {Array.from({ length: SEG_COUNT }).map((_, i) => {
                const rad = (i * ANGLE_STEP - 90) * (Math.PI / 180);
                return (
                  <line
                    key={i}
                    x1={(CX + 14 * Math.cos(rad)).toFixed(2)}
                    y1={(CY + 14 * Math.sin(rad)).toFixed(2)}
                    x2={(CX + R * Math.cos(rad)).toFixed(2)}
                    y2={(CY + R * Math.sin(rad)).toFixed(2)}
                    stroke="rgba(0,0,0,0.5)"
                    strokeWidth={1}
                  />
                );
              })}

              {/* Center hub */}
              <circle cx={CX} cy={CY} r={15} fill="#111827" stroke="#FFD700" strokeWidth={2.5} />
              <text x={CX} y={CY + 1} textAnchor="middle" dominantBaseline="middle" fontSize={12}>⚠️</text>
            </motion.g>

            {/* Gold outer ring (static) */}
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="#FFD700" strokeWidth={3} filter="url(#glow-ring)" />
            <circle cx={CX} cy={CY} r={R + 5} fill="none" stroke="rgba(255,215,0,0.25)" strokeWidth={1.5} />

            {/* Tick markers at segment borders (static, outside ring) */}
            {Array.from({ length: SEG_COUNT }).map((_, i) => {
              const rad = (i * ANGLE_STEP - 90) * (Math.PI / 180);
              return (
                <circle
                  key={i}
                  cx={(CX + (R + 2) * Math.cos(rad)).toFixed(2)}
                  cy={(CY + (R + 2) * Math.sin(rad)).toFixed(2)}
                  r={3}
                  fill="#FFD700"
                />
              );
            })}
          </svg>
        </div>

        {/* Spinning label */}
        <AnimatePresence mode="wait">
          {phase === 'pre' && (
            <motion.div
              key="pre"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, repeat: Infinity }}
              style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, fontWeight: 500 }}
            >
              กำลังหมุนวงล้อ...
            </motion.div>
          )}

          {phase === 'spinning' && (
            <motion.div
              key="spinning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, fontWeight: 500 }}
            >
              กำลังหมุน...
            </motion.div>
          )}

          {phase === 'result' && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 24, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 380, damping: 22 }}
              style={{
                background: resultGradient,
                borderRadius: 20,
                padding: '18px 32px',
                textAlign: 'center',
                boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
                minWidth: 240,
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 0.5, repeat: 2 }}
                style={{ fontSize: 17, fontWeight: 900, color: '#fff', marginBottom: 6 }}
              >
                {resultTitle}
              </motion.div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'rgba(255,255,255,0.92)' }}>
                {resultSub}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
