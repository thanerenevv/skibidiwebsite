import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { subscribeToGame } from '../firebase/gameService';

interface PlayerWaitingPageProps {
  gameCode: string;
  nickname: string;
  onGameStarted: () => void;
  onGameEnded: () => void;
}

export default function PlayerWaitingPage({ gameCode, nickname, onGameStarted, onGameEnded }: PlayerWaitingPageProps) {
  useEffect(() => {
    const unsub = subscribeToGame(gameCode, (game) => {
      if (!game) return;
      if (game.status === 'question') onGameStarted();
      if (game.status === 'finished') onGameEnded();
    });
    return unsub;
  }, [gameCode, onGameStarted, onGameEnded]);

  const dots = [0, 1, 2, 3];

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        gap: 32,
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        style={{
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 24,
          padding: '40px 36px',
          width: '100%',
          maxWidth: 380,
          boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
          textAlign: 'center',
        }}
      >
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 6px 24px rgba(37,99,235,0.4)',
          }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="rgba(255,255,255,0.2)"/>
            <path d="M12 6v6l4 2" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="2"/>
          </svg>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 8px' }}
        >
          สวัสดี, {nickname}!
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', margin: '0 0 28px', fontWeight: 500 }}
        >
          กำลังรอผู้จัดเริ่มเกม...
        </motion.p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
          {dots.map((i) => (
            <motion.div
              key={i}
              animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
              style={{ width: 10, height: 10, borderRadius: '50%', background: '#60A5FA' }}
            />
          ))}
        </div>

        <div
          style={{
            background: 'rgba(255,255,255,0.08)',
            borderRadius: 12,
            padding: '12px 20px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E' }} />
          <motion.span
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}
          >
            เชื่อมต่อแล้ว · รหัสเกม {gameCode}
          </motion.span>
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', maxWidth: 280, fontWeight: 500 }}
      >
        หน้าจอจะเปลี่ยนอัตโนมัติเมื่อผู้จัดเริ่มเกม
      </motion.p>
    </div>
  );
}
