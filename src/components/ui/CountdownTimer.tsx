import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface CountdownTimerProps {
  questionStartTime: number;
  durationSeconds: number;
  onExpired?: () => void;
  size?: number;
}

export default function CountdownTimer({
  questionStartTime,
  durationSeconds,
  onExpired,
  size = 80,
}: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(durationSeconds);

  useEffect(() => {
    const tick = () => {
      const elapsed = (Date.now() - questionStartTime) / 1000;
      const left = Math.max(0, durationSeconds - elapsed);
      setRemaining(left);
      if (left <= 0) {
        onExpired?.();
        clearInterval(id);
      }
    };
    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [questionStartTime, durationSeconds, onExpired]);

  const progress = remaining / durationSeconds;
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const color =
    progress > 0.5 ? '#22C55E' : progress > 0.25 ? '#F59E0B' : '#EF4444';
  const seconds = Math.ceil(remaining);

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={8}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset, stroke: color }}
          transition={{ duration: 0.2, ease: 'linear' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <motion.span
          key={seconds}
          initial={{ scale: 1.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          style={{
            fontSize: size * 0.3,
            fontWeight: 800,
            color,
            lineHeight: 1,
          }}
        >
          {seconds}
        </motion.span>
      </div>
    </div>
  );
}
