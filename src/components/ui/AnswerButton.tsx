import { motion } from 'framer-motion';
import { CHOICE_COLORS, CHOICE_LABELS } from '../../lib/utils';

interface AnswerButtonProps {
  index: number;
  text: string;
  onClick: () => void;
  disabled?: boolean;
  state?: 'default' | 'selected' | 'correct' | 'wrong' | 'reveal-correct' | 'reveal-wrong';
}

export default function AnswerButton({
  index,
  text,
  onClick,
  disabled = false,
  state = 'default',
}: AnswerButtonProps) {
  const color = CHOICE_COLORS[index];
  const label = CHOICE_LABELS[index];

  const getBg = () => {
    if (state === 'correct' || state === 'reveal-correct') return '#22C55E';
    if (state === 'wrong') return '#EF4444';
    if (state === 'reveal-wrong') return '#94A3B8';
    return color.bg;
  };

  const getOpacity = () => {
    if (state === 'reveal-wrong') return 0.45;
    return 1;
  };

  const shouldPulse = state === 'correct' || state === 'reveal-correct';

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{
        opacity: getOpacity(),
        scale: shouldPulse ? [1, 1.04, 1] : 1,
        y: 0,
        backgroundColor: getBg(),
      }}
      whileHover={!disabled ? { scale: 1.02, y: -2 } : {}}
      whileTap={!disabled ? { scale: 0.96 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 20, duration: 0.3 }}
      style={{
        position: 'relative',
        cursor: disabled ? 'default' : 'pointer',
        border: 'none',
        borderRadius: 16,
        padding: '18px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        width: '100%',
        backgroundColor: getBg(),
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        outline: 'none',
        userSelect: 'none',
        minHeight: 72,
      }}
    >
      <motion.div
        animate={{
          rotate: state === 'correct' || state === 'reveal-correct' ? [0, -10, 10, 0] : 0,
        }}
        transition={{ duration: 0.4, delay: 0.1 }}
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
          color: '#FFFFFF',
        }}
      >
        {label}
      </motion.div>
      <span
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: '#FFFFFF',
          textAlign: 'left',
          lineHeight: 1.35,
          flex: 1,
        }}
      >
        {text}
      </span>
      {(state === 'correct' || state === 'reveal-correct') && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          style={{ fontSize: 22, flexShrink: 0 }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>
      )}
      {state === 'wrong' && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          style={{ fontSize: 22, flexShrink: 0 }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M6 18L18 6M6 6l12 12" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
          </svg>
        </motion.div>
      )}
    </motion.button>
  );
}
