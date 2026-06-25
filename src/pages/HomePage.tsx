import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { subscribeToAvailableGames } from '../firebase/gameService';
import { accentGradient, glassCard, avatarColor } from '../lib/theme';
import type { Game } from '../types';

interface HomePageProps {
  onHostGame: () => void;
  onJoinGame: () => void;
  onJoinRoom: (code: string) => void;
}

const orbs = [
  { left: '-5%',  top: '5%',  size: 420, color: 'rgba(99,102,241,0.18)',  duration: 9,  delay: 0   },
  { left: '65%',  top: '-5%', size: 320, color: 'rgba(236,72,153,0.14)',  duration: 11, delay: 1.5 },
  { left: '75%',  top: '55%', size: 380, color: 'rgba(59,130,246,0.12)',  duration: 13, delay: 0.8 },
  { left: '-8%',  top: '60%', size: 260, color: 'rgba(168,85,247,0.15)', duration: 10, delay: 2   },
];

type Tab = 'home' | 'rooms';

export default function HomePage({ onHostGame, onJoinGame, onJoinRoom }: HomePageProps) {
  const [tab, setTab] = useState<Tab>('home');
  const [rooms, setRooms] = useState<Game[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [joiningCode, setJoiningCode] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToAvailableGames((games) => {
      setRooms(games);
      setRoomsLoading(false);
    });
    return unsub;
  }, []);

  function handleJoinRoom(code: string) {
    setJoiningCode(code);
    onJoinRoom(code);
  }

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
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>

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

        {/* Tab bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, type: 'spring', stiffness: 240, damping: 22 }}
          style={{
            display: 'flex',
            gap: 4,
            padding: 4,
            borderRadius: 16,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            width: '100%',
          }}
        >
          {([
            { id: 'home' as Tab, label: 'หน้าหลัก' },
            { id: 'rooms' as Tab, label: 'ห้องที่เปิดอยู่', badge: rooms.length },
          ]).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                position: 'relative',
                flex: 1,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: '11px 8px',
                borderRadius: 12,
                fontFamily: 'inherit',
                fontSize: 14,
                fontWeight: 700,
                color: tab === t.id ? '#fff' : 'rgba(255,255,255,0.55)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
              }}
            >
              {tab === t.id && (
                <motion.div
                  layoutId="home-tab-pill"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 12,
                    background: accentGradient,
                    boxShadow: '0 6px 20px rgba(139,92,246,0.4)',
                    zIndex: 0,
                  }}
                />
              )}
              <span style={{ position: 'relative', zIndex: 1 }}>{t.label}</span>
              {'badge' in t && t.badge != null && t.badge > 0 && (
                <span
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    fontSize: 11,
                    fontWeight: 800,
                    minWidth: 18,
                    height: 18,
                    padding: '0 5px',
                    borderRadius: 9,
                    background: tab === t.id ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)',
                    color: '#fff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </motion.div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {tab === 'home' ? (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
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
                    เลือกห้องที่เปิดอยู่ หรือกรอกรหัส
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
          ) : (
            <motion.div
              key="rooms"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              style={{ width: '100%' }}
            >
              <HomeRoomList
                rooms={rooms}
                loading={roomsLoading}
                joiningCode={joiningCode}
                onJoin={handleJoinRoom}
              />
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

// ─── Room list for the home tab ───────────────────────────────────────────────

function HomeRoomList({
  rooms,
  loading,
  joiningCode,
  onJoin,
}: {
  rooms: Game[];
  loading: boolean;
  joiningCode: string | null;
  onJoin: (code: string) => void;
}) {
  if (loading) {
    return (
      <div style={{ ...glassCard, borderRadius: 20, padding: '48px 20px', textAlign: 'center' }}>
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
          style={{
            display: 'inline-block',
            width: 28,
            height: 28,
            border: '3px solid rgba(255,255,255,0.25)',
            borderTopColor: '#fff',
            borderRadius: '50%',
          }}
        />
        <p style={{ marginTop: 14, fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
          กำลังค้นหาห้องที่เปิดอยู่...
        </p>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div style={{ ...glassCard, borderRadius: 20, padding: '40px 24px', textAlign: 'center' }}>
        <div
          style={{
            width: 60, height: 60, borderRadius: 18, margin: '0 auto 16px',
            background: 'rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <path d="M3 9l9-6 9 6v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="rgba(255,255,255,0.4)" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M9 22V12h6v10" stroke="rgba(255,255,255,0.4)" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 style={{ fontSize: 17, fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>
          ยังไม่มีห้องที่เปิดอยู่
        </h3>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', margin: 0, fontWeight: 500 }}>
          รอผู้จัดสร้างห้อง หรือไปที่ "เข้าร่วมเกม" แล้วกรอกรหัสเอง
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <AnimatePresence initial={false}>
        {rooms.map((room, i) => (
          <HomeRoomCard
            key={room.code}
            room={room}
            index={i}
            joining={joiningCode === room.code}
            anyJoining={joiningCode != null}
            onJoin={() => onJoin(room.code)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function HomeRoomCard({
  room,
  index,
  joining,
  anyJoining,
  onJoin,
}: {
  room: Game;
  index: number;
  joining: boolean;
  anyJoining: boolean;
  onJoin: () => void;
}) {
  const host = room.hostName || 'โฮสต์';
  const members = room.playerCount ?? 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', stiffness: 300, damping: 26, delay: Math.min(index * 0.04, 0.3) }}
      style={{ ...glassCard, borderRadius: 18, padding: 16, overflow: 'hidden' }}
    >
      {/* Top: host + members */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 46, height: 46, borderRadius: 13, flexShrink: 0,
            background: avatarColor(host),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 800, color: '#fff',
            boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
          }}
        >
          {host.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {host}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.8, repeat: Infinity }}
                style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }}
              />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#4ADE80' }}>เปิดอยู่</span>
            </span>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: 600, marginTop: 2 }}>
            รหัส <span style={{ color: 'rgba(255,255,255,0.78)', letterSpacing: '1.5px', fontWeight: 800 }}>{room.code}</span>
          </div>
        </div>
        <div
          style={{
            flexShrink: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 12, padding: '6px 12px',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{members}</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>ผู้เล่น</span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '14px 0 12px' }} />

      {/* Bottom: meta + join */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M9 11l3 3L22 4" stroke="rgba(255,255,255,0.45)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="rgba(255,255,255,0.45)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {room.totalQuestions} คำถาม
        </span>
        <motion.button
          onClick={onJoin}
          disabled={anyJoining}
          whileHover={!anyJoining ? { scale: 1.04 } : {}}
          whileTap={!anyJoining ? { scale: 0.96 } : {}}
          style={{
            border: 'none',
            borderRadius: 12,
            padding: '11px 22px',
            background: accentGradient,
            color: '#fff',
            fontSize: 14,
            fontWeight: 800,
            fontFamily: 'inherit',
            cursor: anyJoining ? 'not-allowed' : 'pointer',
            boxShadow: '0 6px 18px rgba(139,92,246,0.4)',
            opacity: anyJoining && !joining ? 0.5 : 1,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            minWidth: 104,
            justifyContent: 'center',
          }}
        >
          {joining ? (
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              style={{
                display: 'inline-block',
                width: 18,
                height: 18,
                border: '2.5px solid rgba(255,255,255,0.35)',
                borderTopColor: '#fff',
                borderRadius: '50%',
              }}
            />
          ) : (
            <>
              เข้าร่วม
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
