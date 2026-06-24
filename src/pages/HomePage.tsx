import { motion } from 'framer-motion';

interface HomePageProps {
  onHostGame: () => void;
  onJoinGame: () => void;
}

const orbs = [
  { left: '-5%',  top: '5%',  size: 420, color: 'rgba(99,102,241,0.18)',  duration: 9,  delay: 0   },
  { left: '65%',  top: '-5%', size: 320, color: 'rgba(236,72,153,0.14)',  duration: 11, delay: 1.5 },
  { left: '75%',  top: '55%', size: 380, color: 'rgba(59,130,246,0.12)',  duration: 13, delay: 0.8 },
  { left: '-8%',  top: '60%', size: 260, color: 'rgba(168,85,247,0.15)', duration: 10, delay: 2   },
];

export default function HomePage({ onHostGame, onJoinGame }: HomePageProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
      }}
    >
      {/* Animated background orbs */}
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          animate={{
            x: [0, 25, -15, 10, 0],
            y: [0, -18, 24, -8, 0],
            scale: [1, 1.08, 0.96, 1.04, 1],
          }}
          transition={{ duration: orb.duration, delay: orb.delay, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'fixed',
            left: orb.left,
            top: orb.top,
            width: orb.size,
            height: orb.size,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${orb.color}, transparent 70%)`,
            filter: 'blur(48px)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      ))}

      {/* Subtle grid overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 36 }}>

        {/* Title block */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 20, delay: 0.18 }}
          style={{ textAlign: 'center' }}
        >
          <h1
            style={{
              fontSize: 'clamp(38px, 10vw, 64px)',
              fontWeight: 900,
              margin: 0,
              lineHeight: 1.04,
              letterSpacing: '-2px',
              background: 'linear-gradient(135deg, #fff 30%, rgba(196,181,253,0.9) 70%, rgba(236,72,153,0.85) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            กฎหมายธุรกิจ
          </h1>

          {/* Animated underline */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            style={{
              height: 3,
              background: 'linear-gradient(90deg, #6366F1, #A855F7, #EC4899)',
              borderRadius: 2,
              margin: '10px auto 12px',
              width: '55%',
              transformOrigin: 'left',
            }}
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            style={{
              fontSize: 'clamp(14px, 3.5vw, 18px)',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.55)',
              margin: 0,
              letterSpacing: '3px',
              textTransform: 'uppercase',
            }}
          >
            Quiz Challenge
          </motion.p>
        </motion.div>

        {/* Action cards */}
        <motion.div
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.32 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}
        >
          {/* Join — primary */}
          <motion.button
            onClick={onJoinGame}
            whileHover={{ scale: 1.025, y: -5 }}
            whileTap={{ scale: 0.975 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            style={{
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 55%, #A855F7 100%)',
              border: 'none',
              borderRadius: 22,
              padding: '26px 28px',
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              cursor: 'pointer',
              boxShadow: '0 10px 40px rgba(99,102,241,0.5), 0 0 0 1px rgba(255,255,255,0.12) inset',
              width: '100%',
              fontFamily: 'inherit',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Sweeping shine */}
            <motion.div
              animate={{ x: ['-120%', '220%'] }}
              transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '45%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                pointerEvents: 'none',
              }}
            />

            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 15,
                background: 'rgba(255,255,255,0.22)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="#fff" strokeWidth="2.3" strokeLinecap="round"/>
                <circle cx="9" cy="7" r="4" stroke="#fff" strokeWidth="2.3"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="#fff" strokeWidth="2.3" strokeLinecap="round"/>
              </svg>
            </div>

            <div style={{ textAlign: 'left', flex: 1 }}>
              <div style={{ fontSize: 19, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>เข้าร่วมเกม</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.68)', fontWeight: 500, marginTop: 3 }}>
                กรอกรหัสเกมเพื่อเข้าร่วม
              </div>
            </div>

            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, opacity: 0.75 }}>
              <path d="M9 18l6-6-6-6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.button>

          {/* Host — glass */}
          <motion.button
            onClick={onHostGame}
            whileHover={{ scale: 1.025, y: -5 }}
            whileTap={{ scale: 0.975 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1.5px solid rgba(255,255,255,0.18)',
              borderRadius: 22,
              padding: '26px 28px',
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              cursor: 'pointer',
              backdropFilter: 'blur(24px)',
              boxShadow: '0 4px 28px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.06) inset',
              width: '100%',
              fontFamily: 'inherit',
            }}
          >
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 15,
                background: 'rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="3" width="20" height="14" rx="2" stroke="rgba(255,255,255,0.88)" strokeWidth="2.3"/>
                <path d="M8 21h8M12 17v4" stroke="rgba(255,255,255,0.88)" strokeWidth="2.3" strokeLinecap="round"/>
              </svg>
            </div>

            <div style={{ textAlign: 'left', flex: 1 }}>
              <div style={{ fontSize: 19, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>จัดเกม</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.48)', fontWeight: 500, marginTop: 3 }}>
                สร้างห้องและเชิญผู้เล่น
              </div>
            </div>

            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, opacity: 0.35 }}>
              <path d="M9 18l6-6-6-6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.button>
        </motion.div>

      </div>
    </div>
  );
}
