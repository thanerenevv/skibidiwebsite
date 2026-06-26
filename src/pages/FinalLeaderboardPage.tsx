import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { subscribeToPlayers } from '../firebase/gameService';
import { formatScore } from '../lib/scoring';
import type { Player } from '../types';

interface FinalLeaderboardPageProps {
  gameCode: string;
  playerId?: string;
  onPlayAgain: () => void;
}

const PODIUM_COLORS = [
  { bg: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)', shadow: 'rgba(245,158,11,0.4)', label: '1st' },
  { bg: 'linear-gradient(135deg, #64748B 0%, #94A3B8 100%)', shadow: 'rgba(100,116,139,0.4)', label: '2nd' },
  { bg: 'linear-gradient(135deg, #B45309 0%, #D97706 100%)', shadow: 'rgba(180,83,9,0.4)', label: '3rd' },
];

const CONFETTI_COLORS = ['#F59E0B', '#3B82F6', '#22C55E', '#A855F7', '#EF4444', '#06B6D4'];

export default function FinalLeaderboardPage({
  gameCode,
  playerId,
  onPlayAgain,
}: FinalLeaderboardPageProps) {
  const [players, setPlayers] = useState<Player[]>([]);

  // Compute confetti particles once so they don't re-randomize (and re-animate)
  // every time the player list updates over the subscription.
  const confetti = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        startX: Math.random() * 100,
        startRotate: Math.random() * 360,
        endRotate: Math.random() * 720,
        duration: 4 + Math.random() * 3,
        delay: i * 0.3,
        size: 8 + Math.random() * 12,
        round: Math.random() > 0.5,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      })),
    [],
  );

  useEffect(() => {
    const unsub = subscribeToPlayers(gameCode, setPlayers);
    return unsub;
  }, [gameCode]);

  const myRank = playerId
    ? players.findIndex((p) => p.id === playerId) + 1
    : null;
  const myPlayer = playerId ? players.find((p) => p.id === playerId) : null;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px',
        gap: 24,
        boxSizing: 'border-box',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {confetti.map((c, i) => (
        <motion.div
          key={i}
          initial={{ y: '110vh', x: `${c.startX}vw`, rotate: c.startRotate }}
          animate={{ y: '-10vh', rotate: c.endRotate }}
          transition={{ duration: c.duration, delay: c.delay, ease: 'linear' }}
          style={{
            position: 'fixed',
            width: c.size,
            height: c.size,
            borderRadius: c.round ? '50%' : 2,
            background: c.color,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.2 }}
        style={{ textAlign: 'center', zIndex: 1 }}
      >
        <div style={{ fontSize: 48, marginBottom: 8 }}>
          <motion.svg
            width="56" height="56" viewBox="0 0 24 24" fill="none"
            animate={{ rotate: [0, -15, 15, -10, 10, 0] }}
            transition={{ duration: 1, delay: 0.8 }}
            style={{ display: 'block', margin: '0 auto' }}
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill="#F59E0B" stroke="#F59E0B" strokeWidth="1.5"/>
          </motion.svg>
        </div>
        <h1
          style={{
            fontSize: 'clamp(28px, 6vw, 42px)',
            fontWeight: 800,
            color: '#FFFFFF',
            margin: '0 0 6px',
            letterSpacing: '-0.5px',
          }}
        >
          จบเกมแล้ว!
        </h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', margin: 0, fontWeight: 600 }}>
          อันดับสุดท้าย
        </p>
      </motion.div>

      {myPlayer && myRank && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 260, damping: 22 }}
          style={{
            background: 'rgba(255,255,255,0.08)',
            borderRadius: 16,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            border: '1px solid rgba(255,255,255,0.15)',
            zIndex: 1,
          }}
        >
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>อันดับของคุณ</div>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 24, fontWeight: 800, color: '#FBBF24' }}>
            #{myRank}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>
            {formatScore(myPlayer.score)}
          </div>
        </motion.div>
      )}

      {players.length >= 3 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            gap: 8,
            paddingBottom: 8,
            zIndex: 1,
          }}
        >
          {[players[1], players[0], players[2]].map((player, displayIndex) => {
            const actualIndex = [1, 0, 2][displayIndex];
            const heights = [100, 130, 80];
            const color = PODIUM_COLORS[actualIndex];
            return (
              <motion.div
                key={player.id}
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 + displayIndex * 0.15, type: 'spring', stiffness: 260, damping: 22 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: '0 0 auto', width: 110 }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: `hsl(${(player.nickname.charCodeAt(0) * 47) % 360}, 65%, 55%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    fontWeight: 800,
                    color: '#fff',
                    boxShadow: `0 4px 16px ${color.shadow}`,
                  }}
                >
                  {player.nickname.charAt(0).toUpperCase()}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', textAlign: 'center', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {player.nickname}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
                  {formatScore(player.score)}
                </div>
                <div
                  style={{
                    width: '100%',
                    height: heights[displayIndex],
                    background: color.bg,
                    borderRadius: '12px 12px 0 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 4px 24px ${color.shadow}`,
                  }}
                >
                  <span style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>
                    {color.label}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 1, overflowY: 'auto' }}>
        <AnimatePresence>
          {players.slice(3).map((player, i) => (
            <motion.div
              key={player.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + i * 0.05 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 14,
                padding: '12px 16px',
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 800,
                  color: 'rgba(255,255,255,0.6)',
                  flexShrink: 0,
                }}
              >
                #{i + 4}
              </div>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: `hsl(${(player.nickname.charCodeAt(0) * 47) % 360}, 60%, 50%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 15,
                  fontWeight: 800,
                  color: '#fff',
                  flexShrink: 0,
                }}
              >
                {player.nickname.charAt(0).toUpperCase()}
              </div>
              <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {player.nickname}
              </span>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', flexShrink: 0 }}>
                {formatScore(player.score)}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, type: 'spring', stiffness: 260, damping: 22 }}
        style={{ zIndex: 1 }}
      >
        <motion.button
          onClick={onPlayAgain}
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 16,
            padding: '18px 32px',
            fontSize: 17,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 6px 24px rgba(37,99,235,0.35)',
            fontFamily: 'inherit',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 3v5h5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          กลับหน้าหลัก
        </motion.button>
      </motion.div>
    </div>
  );
}
