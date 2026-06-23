import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MagnetizeButton } from '@/components/ui/magnetize-button';
import { createGame, subscribeToPlayers, startGame } from '../firebase/gameService';
import { generateGameCode, generateId } from '../lib/utils';
import { QUESTIONS } from '../data/questions';
import MotionButton from '../components/ui/Button';
import type { Player } from '../types';

interface HostDashboardPageProps {
  onGameStarted: (gameCode: string, hostId: string) => void;
  onBack: () => void;
}

const glass = {
  background: 'rgba(0,0,0,0.45)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.12)',
} as const;

export default function HostDashboardPage({ onGameStarted, onBack }: HostDashboardPageProps) {
  const [gameCode, setGameCode] = useState<string | null>(null);
  const [hostId] = useState(() => {
    const stored = localStorage.getItem('quiztime_host');
    if (stored) { try { return JSON.parse(stored).hostId; } catch { /* ignore */ } }
    return generateId();
  });
  const [players, setPlayers] = useState<Player[]>([]);
  const [creating, setCreating] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('quiztime_host');
    if (stored) {
      try {
        const { gameCode: storedCode } = JSON.parse(stored);
        if (storedCode) setGameCode(storedCode);
      } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    if (!gameCode) return;
    const unsub = subscribeToPlayers(gameCode, setPlayers);
    return unsub;
  }, [gameCode]);

  async function handleCreateGame() {
    setCreating(true);
    setError('');
    try {
      const code = generateGameCode();
      await createGame(hostId, code);
      setGameCode(code);
      localStorage.setItem('quiztime_host', JSON.stringify({ hostId, gameCode: code }));
    } catch {
      setError('ไม่สามารถสร้างเกมได้ กรุณาตรวจสอบ Firebase Configuration');
    } finally {
      setCreating(false);
    }
  }

  async function handleStartGame() {
    if (!gameCode) return;
    if (players.length === 0) { setError('ต้องมีผู้เล่นอย่างน้อย 1 คนก่อนเริ่มเกม'); return; }
    setStarting(true);
    setError('');
    try {
      await startGame(gameCode);
      onGameStarted(gameCode, hostId);
    } catch {
      setError('เกิดข้อผิดพลาดในการเริ่มเกม');
    } finally {
      setStarting(false);
    }
  }

  async function handleNewGame() {
    setGameCode(null);
    setPlayers([]);
    localStorage.removeItem('quiztime_host');
  }

  function handleCopyCode() {
    if (!gameCode) return;
    navigator.clipboard.writeText(gameCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        maxWidth: 680,
        margin: '0 auto',
        boxSizing: 'border-box',
      }}
    >
      {/* Nav */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 8 }}
      >
        <MagnetizeButton
          onClick={onBack}
          whileHover={{ x: -3 }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.6)',
            fontSize: 14,
            fontWeight: 600,
            padding: 0,
            fontFamily: 'inherit',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="rgba(255,255,255,0.6)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          กลับ
        </MagnetizeButton>
        <div style={{ flex: 1 }} />
        <div
          style={{
            background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
            borderRadius: 10,
            padding: '6px 14px',
            fontSize: 12,
            fontWeight: 700,
            color: '#fff',
          }}
        >
          HOST MODE
        </div>
      </motion.div>

      {/* Header card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 22 }}
        style={{ borderRadius: 20, padding: '24px', boxShadow: '0 4px 24px rgba(0,0,0,0.3)', ...glass }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>
          จัดการเกม
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: 0, fontWeight: 500 }}>
          {QUESTIONS.length} คำถาม · 30 วินาที/ข้อ · สูงสุด 1,500 คะแนน/ข้อ
        </p>
      </motion.div>

      {!gameCode ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 22 }}
          style={{ borderRadius: 20, padding: '32px 24px', boxShadow: '0 4px 24px rgba(0,0,0,0.3)', textAlign: 'center', ...glass }}
        >
          <motion.div
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: 64, height: 64, borderRadius: 18,
              background: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 6px 20px rgba(245,158,11,0.4)',
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </motion.div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>
            สร้างเกมใหม่
          </h3>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: '0 0 24px', fontWeight: 500 }}>
            ระบบจะสร้างรหัสเกมสำหรับแชร์ให้ผู้เล่น
          </p>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: '12px 16px',
                background: 'rgba(239,68,68,0.2)',
                borderRadius: 10,
                border: '1px solid rgba(239,68,68,0.4)',
                fontSize: 13, color: '#FCA5A5', fontWeight: 600,
                marginBottom: 16, textAlign: 'left',
              }}
            >
              {error}
            </motion.div>
          )}
          <MotionButton onClick={handleCreateGame} loading={creating} size="lg" fullWidth>
            สร้างเกม
          </MotionButton>
        </motion.div>
      ) : (
        <>
          {/* Game code card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            style={{
              background: 'linear-gradient(135deg, rgba(30,27,75,0.85) 0%, rgba(37,99,235,0.75) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 20,
              padding: '28px 24px',
              boxShadow: '0 8px 32px rgba(37,99,235,0.3)',
              textAlign: 'center',
              color: '#fff',
            }}
          >
            <p style={{ fontSize: 13, fontWeight: 700, opacity: 0.7, margin: '0 0 8px', letterSpacing: '2px' }}>
              รหัสเกม
            </p>
            <motion.div
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              style={{ fontSize: 'clamp(42px, 10vw, 64px)', fontWeight: 800, letterSpacing: '8px', margin: '0 0 16px', lineHeight: 1 }}
            >
              {gameCode}
            </motion.div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <MagnetizeButton
                onClick={handleCopyCode}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  borderRadius: 10, padding: '10px 20px',
                  color: '#fff', fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <AnimatePresence mode="wait">
                  {copied ? (
                    <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }}>✓</motion.span>
                  ) : (
                    <motion.span key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <rect x="9" y="9" width="13" height="13" rx="2" stroke="#fff" strokeWidth="2"/>
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="#fff" strokeWidth="2"/>
                      </svg>
                    </motion.span>
                  )}
                </AnimatePresence>
                {copied ? 'คัดลอกแล้ว!' : 'คัดลอก'}
              </MagnetizeButton>
              <MagnetizeButton
                onClick={handleNewGame}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  borderRadius: 10, padding: '10px 20px',
                  color: '#fff', fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                เกมใหม่
              </MagnetizeButton>
            </div>
          </motion.div>

          {/* Players list */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 22 }}
            style={{ borderRadius: 20, padding: '20px 24px', boxShadow: '0 4px 24px rgba(0,0,0,0.3)', flex: 1, ...glass }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>ผู้เล่นที่เข้าร่วม</h3>
              <motion.div
                key={players.length}
                initial={{ scale: 1.3 }}
                animate={{ scale: 1 }}
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  borderRadius: 20, padding: '4px 12px',
                  fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.7)',
                }}
              >
                {players.length} คน
              </motion.div>
            </div>

            {players.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.35)', fontSize: 14, fontWeight: 500 }}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto 8px', display: 'block' }}>
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="9" cy="7" r="4" stroke="rgba(255,255,255,0.25)" strokeWidth="2"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                กำลังรอผู้เล่นเข้าร่วม...
              </motion.div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
                <AnimatePresence initial={false}>
                  {players.map((player) => (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, x: -20, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 20, scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                      layout
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 14px',
                        background: 'rgba(255,255,255,0.07)',
                        borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    >
                      <div
                        style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: `hsl(${(player.nickname.charCodeAt(0) * 47) % 360}, 60%, 55%)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 16, fontWeight: 800, color: '#fff', flexShrink: 0,
                        }}
                      >
                        {player.nickname.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>
                        {player.nickname}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>

          {/* Start button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 22 }}
          >
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: '12px 16px',
                  background: 'rgba(239,68,68,0.2)',
                  borderRadius: 12,
                  border: '1px solid rgba(239,68,68,0.4)',
                  fontSize: 14, color: '#FCA5A5', fontWeight: 600,
                  marginBottom: 12,
                }}
              >
                {error}
              </motion.div>
            )}
            <MotionButton
              onClick={handleStartGame}
              loading={starting}
              disabled={players.length === 0}
              fullWidth
              size="lg"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <polygon points="5,3 19,12 5,21" fill="#fff"/>
              </svg>
              เริ่มเกม ({players.length} ผู้เล่น)
            </MotionButton>
          </motion.div>
        </>
      )}
    </div>
  );
}
