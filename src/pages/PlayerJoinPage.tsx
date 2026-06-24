import { useState } from 'react';
import { motion } from 'framer-motion';
import { checkGame, joinGame } from '../firebase/gameService';
import { generateId } from '../lib/utils';
import MotionButton from '../components/ui/Button';

interface PlayerJoinPageProps {
  onJoined: (gameCode: string, playerId: string, nickname: string) => void;
  onBack: () => void;
}

const glass = {
  background: 'rgba(0,0,0,0.45)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.12)',
} as const;

export default function PlayerJoinPage({ onJoined, onBack }: PlayerJoinPageProps) {
  const [gameCode, setGameCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    const code = gameCode.trim();
    const nick = nickname.trim();

    if (!code) { setError('กรุณากรอกรหัสเกม'); return; }
    if (!nick) { setError('กรุณากรอกชื่อเล่น'); return; }
    if (nick.length > 20) { setError('ชื่อเล่นต้องไม่เกิน 20 ตัวอักษร'); return; }

    setLoading(true);
    setError('');

    try {
      const status = await checkGame(code);
      if (status === 'not_found') { setError('ไม่พบรหัสเกมนี้ กรุณาตรวจสอบอีกครั้ง'); return; }
      if (status === 'active') { setError('เกมเริ่มแล้ว ไม่สามารถเข้าร่วมได้ในขณะนี้'); return; }

      const playerId = generateId();
      await joinGame(code, playerId, nick);
      localStorage.setItem('quiztime_player', JSON.stringify({ gameCode: code, playerId, nickname: nick }));
      onJoined(code, playerId, nick);
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  }

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
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        style={{
          width: '100%',
          maxWidth: 400,
          borderRadius: 24,
          padding: '36px 28px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
          ...glass,
        }}
      >
        <motion.button
          onClick={onBack}
          whileHover={{ x: -3 }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.6)',
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 24,
            padding: 0,
            fontFamily: 'inherit',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="rgba(255,255,255,0.6)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          กลับ
        </motion.button>

        <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
          เข้าร่วมเกม
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: '0 0 28px', fontWeight: 500 }}>
          กรอกรหัสเกมและชื่อเล่นของคุณ
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 8, letterSpacing: '0.5px' }}>
              รหัสเกม
            </label>
            <input
              type="text"
              value={gameCode}
              onChange={(e) => { setGameCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              placeholder="000000"
              maxLength={6}
              style={{
                width: '100%',
                padding: '14px 16px',
                border: '2px solid rgba(255,255,255,0.15)',
                borderRadius: 12,
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: '6px',
                textAlign: 'center',
                outline: 'none',
                fontFamily: 'inherit',
                color: '#fff',
                background: 'rgba(255,255,255,0.08)',
                boxSizing: 'border-box',
                transition: 'border-color 200ms',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(100,150,255,0.7)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.15)')}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 8, letterSpacing: '0.5px' }}>
              ชื่อเล่น
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => { setNickname(e.target.value.slice(0, 20)); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              placeholder="กรอกชื่อเล่นของคุณ"
              style={{
                width: '100%',
                padding: '14px 16px',
                border: '2px solid rgba(255,255,255,0.15)',
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 600,
                outline: 'none',
                fontFamily: 'inherit',
                color: '#fff',
                background: 'rgba(255,255,255,0.08)',
                boxSizing: 'border-box',
                transition: 'border-color 200ms',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(100,150,255,0.7)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.15)')}
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: '12px 16px',
                background: 'rgba(239,68,68,0.2)',
                borderRadius: 10,
                border: '1px solid rgba(239,68,68,0.4)',
                fontSize: 14,
                color: '#FCA5A5',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#FCA5A5" strokeWidth="2"/>
                <path d="M12 8v4M12 16h.01" stroke="#FCA5A5" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
              {error}
            </motion.div>
          )}

          <MotionButton onClick={handleJoin} loading={loading} disabled={loading} fullWidth size="lg">
            เข้าร่วมเกม
          </MotionButton>
        </div>
      </motion.div>
    </div>
  );
}
