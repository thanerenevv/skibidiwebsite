import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
  label?: string;
}

export default function LoadingSpinner({
  size = 48,
  color = '#2563EB',
  label,
}: LoadingSpinnerProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        style={{
          width: size,
          height: size,
          border: `${size * 0.1}px solid #E2E8F0`,
          borderTopColor: color,
          borderRadius: '50%',
        }}
      />
      {label && (
        <p
          style={{
            color: '#64748B',
            fontSize: 14,
            fontWeight: 500,
            margin: 0,
          }}
        >
          {label}
        </p>
      )}
    </div>
  );
}
