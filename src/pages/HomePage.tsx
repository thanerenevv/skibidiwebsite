import { motion, type Variants } from 'framer-motion';
import { LiquidButton } from '@/components/ui/liquid-glass-button';

interface HomePageProps {
  onHostGame: () => void;
  onJoinGame: () => void;
}

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.13, delayChildren: 0.25 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } },
};

export default function HomePage({ onHostGame, onJoinGame }: HomePageProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 30,
          width: '100%',
          maxWidth: 440,
        }}
      >
        {/* Headline */}
        <motion.div variants={item} style={{ textAlign: 'center' }}>
          <motion.h1
            style={{
              fontSize: 'clamp(38px, 9vw, 58px)',
              fontWeight: 800,
              color: '#ffffff',
              margin: 0,
              lineHeight: 1.08,
              letterSpacing: '-1.5px',
              textShadow: '0 0 40px rgba(255,100,50,0.5), 0 2px 12px rgba(0,0,0,0.6)',
            }}
          >
            กฎหมายธุรกิจ
          </motion.h1>
          <motion.h2
            style={{
              fontSize: 'clamp(20px, 4.5vw, 28px)',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.75)',
              margin: '4px 0 0',
              letterSpacing: '-0.3px',
              fontStyle: 'italic',
              textShadow: '0 0 20px rgba(100,200,255,0.4)',
            }}
          >
            ควิซชาเลนจ์
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.55)',
              margin: '12px 0 0',
              fontWeight: 600,
              letterSpacing: '0.4px',
            }}
          >
            15 คำถาม · 30 วินาที/ข้อ · สูงสุด 1,500 คะแนน
          </motion.p>
        </motion.div>

        {/* Buttons */}
        <motion.div
          variants={item}
          style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', alignItems: 'center' }}
        >
          <LiquidButton
            onClick={onJoinGame}
            size="xl"
            className="text-white border border-white/30 rounded-full w-full max-w-xs font-bold text-base"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/>
              <circle cx="9" cy="7" r="4" stroke="#fff" strokeWidth="2.2"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
            เข้าร่วมเกม
          </LiquidButton>

          <motion.button
            onClick={onHostGame}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.85)',
              border: '1.5px solid rgba(255,255,255,0.2)',
              borderRadius: 16,
              padding: '18px 32px',
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
              fontFamily: 'inherit',
              width: '100%',
              maxWidth: 320,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="3" width="20" height="14" rx="2" stroke="rgba(255,255,255,0.85)" strokeWidth="2.2"/>
              <path d="M8 21h8M12 17v4" stroke="rgba(255,255,255,0.85)" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
            จัดเกม
          </motion.button>
        </motion.div>

        {/* Stat pills */}
        <motion.div variants={item} style={{ display: 'flex', gap: 10 }}>
          {[
            { value: '15', label: 'คำถาม' },
            { value: '30 วิ', label: 'ต่อข้อ' },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                textAlign: 'center',
                padding: '10px 14px',
                background: 'rgba(255,255,255,0.08)',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div style={{ fontSize: 17, fontWeight: 800, color: '#ffffff' }}>{stat.value}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginTop: 2, letterSpacing: '0.3px' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
