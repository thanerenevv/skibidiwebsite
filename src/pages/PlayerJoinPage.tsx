import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  checkGame,
  joinGame,
  subscribeToAvailableGames,
} from '../firebase/gameService';
import { generateId } from '../lib/utils';
import {
  accentGradient,
  glassCard,
  fieldStyle,
  focusField,
  blurField,
  avatarColor,
} from '../lib/theme';
import type { Game } from '../types';

interface PlayerJoinPageProps {
  initialCode?: string;
  onJoined: (gameCode: string, playerId: string, nickname: string) => void;
  onBack: () => void;
}

type Tab = 'rooms' | 'code';

export default function PlayerJoinPage({ initialCode, onJoined, onBack }: PlayerJoinPageProps) {
  const [nickname, setNickname] = useState(
    () => localStorage.getItem('quiztime_nick') ?? '',
  );
  const [tab, setTab] = useState<Tab>(initialCode ? 'code' : 'rooms');
  const [rooms, setRooms] = useState<Game[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [manualCode, setManualCode] = useState(initialCode ?? '');
  const [error, setError] = useState('');
  const [joiningCode, setJoiningCode] = useState<string | null>(null);
  const nickRef = useRef<HTMLInputElement>(null);

  // Live lobby of every joinable room.
  useEffect(() => {
    const unsub = subscribeToAvailableGames((games) => {
      setRooms(games);
      setRoomsLoading(false);
    });
    return unsub;
  }, []);

  function persistNick(value: string) {
    setNickname(value);
    localStorage.setItem('quiztime_nick', value);
    if (error) setError('');
  }

  async function handleJoin(code: string) {
    const nick = nickname.trim();
    const c = code.trim();

    if (!nick) {
      setError('กรุณากรอกชื่อเล่นก่อนเข้าร่วม');
      nickRef.current?.focus();
      return;
    }
    if (nick.length > 20) {
      setError('ชื่อเล่นต้องไม่เกิน 20 ตัวอักษร');
      return;
    }
    if (!c) {
      setError('กรุณากรอกรหัสเกม');
      return;
    }

    setJoiningCode(c);
    setError('');
    try {
      const status = await checkGame(c);
      if (status === 'not_found') {
        setError('ไม่พบรหัสเกมนี้ กรุณาตรวจสอบอีกครั้ง');
        return;
      }
      if (status === 'active') {
        setError('เกมนี้เริ่มไปแล้ว ไม่สามารถเข้าร่วมได้');
        return;
      }
      const playerId = generateId();
      await joinGame(c, playerId, nick);
      localStorage.setItem(
        'quiztime_player',
        JSON.stringify({ gameCode: c, playerId, nickname: nick }),
      );
      onJoined(c, playerId, nick);
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setJoiningCode(null);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '28px 20px 40px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 460, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Back */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onBack}
          whileHover={{ x: -3 }}
          style={{
            alignSelf: 'flex-start',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.6)',
            fontSize: 14,
            fontWeight: 600,
            padding: 0,
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="rgba(255,255,255,0.6)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          กลับ
        </motion.button>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 240, damping: 22 }}
        >
          <h1 style={{ fontSize: 30, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.8px' }}>
            เข้าร่วมเกม
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: '6px 0 0', fontWeight: 500 }}>
            เลือกห้องที่เปิดอยู่ หรือกรอกรหัสเพื่อเข้าร่วม
          </p>
        </motion.div>

        {/* Nickname */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06, type: 'spring', stiffness: 240, damping: 22 }}
          style={{ ...glassCard, borderRadius: 18, padding: '16px 18px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <label htmlFor="join-nickname" style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.6px' }}>
              ชื่อเล่นของคุณ
            </label>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
              {nickname.length}/20
            </span>
          </div>
          <input
            id="join-nickname"
            ref={nickRef}
            type="text"
            value={nickname}
            onChange={(e) => persistNick(e.target.value.slice(0, 20))}
            placeholder="กรอกชื่อเล่นของคุณ"
            autoComplete="off"
            maxLength={20}
            style={fieldStyle}
            onFocus={(e) => focusField(e.target)}
            onBlur={(e) => blurField(e.target)}
          />
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, type: 'spring', stiffness: 240, damping: 22 }}
          style={{
            display: 'flex',
            gap: 4,
            padding: 4,
            borderRadius: 16,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {([
            { id: 'rooms' as Tab, label: 'ห้องที่เปิดอยู่', badge: rooms.length },
            { id: 'code' as Tab, label: 'ใส่รหัสเอง', badge: null },
          ]).map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setError(''); }}
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
                  layoutId="tab-pill"
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
              {t.badge != null && t.badge > 0 && (
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

        {/* Error toast */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              style={{
                padding: '12px 16px',
                background: 'rgba(239,68,68,0.18)',
                borderRadius: 12,
                border: '1px solid rgba(239,68,68,0.4)',
                fontSize: 14,
                color: '#FCA5A5',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" stroke="#FCA5A5" strokeWidth="2" />
                <path d="M12 8v4M12 16h.01" stroke="#FCA5A5" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {tab === 'rooms' ? (
            <motion.div
              key="rooms"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <RoomList
                rooms={rooms}
                loading={roomsLoading}
                joiningCode={joiningCode}
                onJoin={handleJoin}
                onUseCode={() => { setTab('code'); setError(''); }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="code"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              style={{ ...glassCard, borderRadius: 20, padding: '24px 20px' }}
            >
              <label htmlFor="join-code" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 10, letterSpacing: '0.6px' }}>
                รหัสเกม (6 หลัก)
              </label>
              <input
                id="join-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                value={manualCode}
                onChange={(e) => { setManualCode(e.target.value.replace(/\D/g, '').slice(0, 6)); if (error) setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin(manualCode)}
                placeholder="000000"
                maxLength={6}
                style={{
                  ...fieldStyle,
                  fontSize: 26,
                  fontWeight: 800,
                  letterSpacing: '10px',
                  textAlign: 'center',
                }}
                onFocus={(e) => focusField(e.target)}
                onBlur={(e) => blurField(e.target)}
              />
              <motion.button
                onClick={() => handleJoin(manualCode)}
                disabled={joiningCode != null}
                whileHover={joiningCode == null ? { scale: 1.02, y: -2 } : {}}
                whileTap={joiningCode == null ? { scale: 0.98 } : {}}
                style={{
                  marginTop: 16,
                  width: '100%',
                  border: 'none',
                  borderRadius: 14,
                  padding: '16px',
                  background: accentGradient,
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 800,
                  fontFamily: 'inherit',
                  cursor: joiningCode != null ? 'not-allowed' : 'pointer',
                  boxShadow: '0 8px 26px rgba(139,92,246,0.45)',
                  opacity: joiningCode != null ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {joiningCode === manualCode.trim() ? <Spinner /> : 'เข้าร่วมเกม'}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Room list ────────────────────────────────────────────────────────────────

function RoomList({
  rooms,
  loading,
  joiningCode,
  onJoin,
  onUseCode,
}: {
  rooms: Game[];
  loading: boolean;
  joiningCode: string | null;
  onJoin: (code: string) => void;
  onUseCode: () => void;
}) {
  if (loading) {
    return (
      <div style={{ ...glassCard, borderRadius: 20, padding: '48px 20px', textAlign: 'center' }}>
        <Spinner large />
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
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', margin: '0 0 18px', fontWeight: 500 }}>
          รอผู้จัดสร้างห้อง หรือกรอกรหัสเกมเองได้เลย
        </p>
        <button
          onClick={onUseCode}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.16)',
            borderRadius: 12,
            padding: '11px 22px',
            color: '#fff',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          กรอกรหัสเอง
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <AnimatePresence initial={false}>
        {rooms.map((room, i) => (
          <RoomCard
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

function RoomCard({
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
            <Spinner />
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

function Spinner({ large = false }: { large?: boolean }) {
  const s = large ? 28 : 18;
  return (
    <motion.span
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
      style={{
        display: 'inline-block',
        width: s,
        height: s,
        border: `${large ? 3 : 2.5}px solid rgba(255,255,255,0.35)`,
        borderTopColor: '#fff',
        borderRadius: '50%',
      }}
    />
  );
}
