import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { subscribeToAvailableGames } from "../firebase/gameService";
import { accentGradient, glassCard, avatarColor } from "../lib/theme";
import type { Game } from "../types";

interface HomePageProps {
  onHostGame: () => void;
  onJoinGame: () => void;
  onJoinRoom: (code: string) => void;
}

type Tab = "home" | "rooms";

const TITLE = "ธุรกิจ";

export default function HomePage({
  onHostGame,
  onJoinGame,
  onJoinRoom,
}: HomePageProps) {
  const [tab, setTab] = useState<Tab>("home");
  const [rooms, setRooms] = useState<Game[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [joiningCode, setJoiningCode] = useState<string | null>(null);

  const [displayText, setDisplayText] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);
  const [typingDone, setTypingDone] = useState(false);
  const [showSub, setShowSub] = useState(false);

  const [isWide, setIsWide] = useState(() => window.innerWidth >= 700);

  useEffect(() => {
    const handler = () => setIsWide(window.innerWidth >= 700);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    const unsub = subscribeToAvailableGames((games) => {
      setRooms(games);
      setRoomsLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    setDisplayText("");
    setTypingDone(false);
    setCursorVisible(true);
    setShowSub(false);
    let i = 0;
    const startDelay = setTimeout(() => {
      const interval = setInterval(() => {
        i++;
        setDisplayText(TITLE.slice(0, i));
        if (i >= TITLE.length) {
          clearInterval(interval);
          setTypingDone(true);
          setTimeout(() => setShowSub(true), 200);
        }
      }, 80);
      return () => clearInterval(interval);
    }, 250);
    return () => clearTimeout(startDelay);
  }, []);

  useEffect(() => {
    if (!typingDone) return;
    let blinks = 0;
    const interval = setInterval(() => {
      setCursorVisible((v) => !v);
      blinks++;
      if (blinks >= 6) {
        clearInterval(interval);
        setCursorVisible(false);
      }
    }, 380);
    return () => clearInterval(interval);
  }, [typingDone]);

  function handleJoinRoom(code: string) {
    setJoiningCode(code);
    onJoinRoom(code);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 24px",
        boxSizing: "border-box",
      }}
    >
      {/* Single minimal background glow */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background:
            "radial-gradient(ellipse 70% 55% at 15% 30%, rgba(99,102,241,0.12) 0%, transparent 65%)," +
            "radial-gradient(ellipse 50% 45% at 80% 75%, rgba(168,85,247,0.09) 0%, transparent 60%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Main layout */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: isWide ? 880 : 460,
          display: "flex",
          flexDirection: isWide ? "row" : "column",
          alignItems: isWide ? "flex-start" : "stretch",
          gap: isWide ? 72 : 32,
        }}
      >
        {/* LEFT: Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            flex: isWide ? "0 0 300px" : undefined,
            textAlign: isWide ? "left" : "center",
            paddingTop: isWide ? 8 : 0,
          }}
        >
          {/* Eyebrow label */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "2px",
              color: "rgba(139,92,246,0.9)",
              marginBottom: 14,
              textTransform: "uppercase",
            }}
          >
            Quiz Game
          </motion.div>

          <h1
            style={{
              fontSize: isWide
                ? "clamp(40px, 4.5vw, 62px)"
                : "clamp(36px, 9vw, 56px)",
              fontWeight: 900,
              margin: 0,
              lineHeight: 1.08,
              letterSpacing: "-1.5px",
              background:
                "linear-gradient(135deg, #ffffff 30%, rgba(196,181,253,0.9) 65%, rgba(236,72,153,0.8) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {displayText}
            <span
              style={{
                display: "inline-block",
                width: 2,
                height: "0.78em",
                background: "rgba(196,181,253,0.85)",
                marginLeft: 3,
                borderRadius: 1,
                verticalAlign: "middle",
                opacity: cursorVisible ? 1 : 0,
                transition: "opacity 80ms",
              }}
            />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={showSub ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
            transition={{ duration: 0.4 }}
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "rgba(255,255,255,0.38)",
              margin: isWide ? "14px 0 0" : "12px auto 0",
              lineHeight: 1.6,
              maxWidth: 260,
            }}
          >
            {rooms.length > 0
              ? `${rooms.length} ห้องที่เปิดอยู่ตอนนี้`
              : "แข่งขันตอบคำถามกฎหมายธุรกิจ"}
          </motion.p>
        </motion.div>

        {/* RIGHT: Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}
        >
          {/* Tab bar */}
          <div
            style={{
              display: "flex",
              gap: 2,
              padding: 3,
              borderRadius: 14,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            {[
              { id: "home" as Tab, label: "หน้าหลัก" },
              {
                id: "rooms" as Tab,
                label: "ห้องที่เปิดอยู่",
                badge: rooms.length,
              },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  position: "relative",
                  flex: 1,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  padding: "10px 8px",
                  borderRadius: 11,
                  fontFamily: "inherit",
                  fontSize: 13,
                  fontWeight: 700,
                  color: tab === t.id ? "#fff" : "rgba(255,255,255,0.45)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  transition: "color 150ms",
                }}
              >
                {tab === t.id && (
                  <motion.div
                    layoutId="tab-bg"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: 11,
                      background: "rgba(255,255,255,0.09)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  />
                )}
                <span style={{ position: "relative", zIndex: 1 }}>
                  {t.label}
                </span>
                {"badge" in t && t.badge != null && t.badge > 0 && (
                  <span
                    style={{
                      position: "relative",
                      zIndex: 1,
                      fontSize: 11,
                      fontWeight: 800,
                      minWidth: 18,
                      height: 18,
                      padding: "0 5px",
                      borderRadius: 9,
                      background:
                        tab === t.id
                          ? "rgba(139,92,246,0.5)"
                          : "rgba(255,255,255,0.1)",
                      color: "#fff",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {t.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            {tab === "home" ? (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {/* Join — primary */}
                <motion.button
                  onClick={onJoinGame}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.28, duration: 0.35 }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.985 }}
                  style={{
                    background: accentGradient,
                    border: "none",
                    borderRadius: 18,
                    padding: "22px 24px",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    cursor: "pointer",
                    boxShadow: "0 8px 32px rgba(99,102,241,0.35)",
                    width: "100%",
                    fontFamily: "inherit",
                  }}
                >
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 12,
                      background: "rgba(255,255,255,0.18)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
                        stroke="#fff"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                      />
                      <circle
                        cx="9"
                        cy="7"
                        r="4"
                        stroke="#fff"
                        strokeWidth="2.2"
                      />
                      <path
                        d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
                        stroke="#fff"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <div style={{ textAlign: "left", flex: 1 }}>
                    <div
                      style={{
                        fontSize: 17,
                        fontWeight: 800,
                        color: "#fff",
                        lineHeight: 1.2,
                      }}
                    >
                      เข้าร่วมเกม
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "rgba(255,255,255,0.65)",
                        fontWeight: 500,
                        marginTop: 3,
                      }}
                    >
                      เลือกห้องที่เปิดอยู่ หรือกรอกรหัส
                    </div>
                  </div>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    style={{ opacity: 0.7, flexShrink: 0 }}
                  >
                    <path
                      d="M9 18l6-6-6-6"
                      stroke="#fff"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </motion.button>

                {/* Host — minimal glass */}
                <motion.button
                  onClick={onHostGame}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.36, duration: 0.35 }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.985 }}
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 18,
                    padding: "22px 24px",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    cursor: "pointer",
                    backdropFilter: "blur(16px)",
                    width: "100%",
                    fontFamily: "inherit",
                    transition: "background 150ms, border-color 150ms",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "rgba(255,255,255,0.08)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "rgba(255,255,255,0.18)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "rgba(255,255,255,0.05)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "rgba(255,255,255,0.12)";
                  }}
                >
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 12,
                      background: "rgba(255,255,255,0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <rect
                        x="2"
                        y="3"
                        width="20"
                        height="14"
                        rx="2"
                        stroke="rgba(255,255,255,0.8)"
                        strokeWidth="2.2"
                      />
                      <path
                        d="M8 21h8M12 17v4"
                        stroke="rgba(255,255,255,0.8)"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <div style={{ textAlign: "left", flex: 1 }}>
                    <div
                      style={{
                        fontSize: 17,
                        fontWeight: 800,
                        color: "#fff",
                        lineHeight: 1.2,
                      }}
                    >
                      จัดเกม
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "rgba(255,255,255,0.42)",
                        fontWeight: 500,
                        marginTop: 3,
                      }}
                    >
                      สร้างห้องและเชิญผู้เล่น
                    </div>
                  </div>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    style={{ flexShrink: 0, opacity: 0.3 }}
                  >
                    <path
                      d="M9 18l6-6-6-6"
                      stroke="#fff"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key="rooms"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
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
        </motion.div>
      </div>
    </div>
  );
}

// ─── Room list ────────────────────────────────────────────────────────────────

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
      <div
        style={{
          ...glassCard,
          borderRadius: 18,
          padding: "44px 20px",
          textAlign: "center",
        }}
      >
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
          style={{
            display: "inline-block",
            width: 24,
            height: 24,
            border: "2px solid rgba(255,255,255,0.15)",
            borderTopColor: "rgba(139,92,246,0.8)",
            borderRadius: "50%",
          }}
        />
        <p
          style={{
            marginTop: 12,
            fontSize: 13,
            color: "rgba(255,255,255,0.4)",
            fontWeight: 500,
          }}
        >
          กำลังค้นหาห้อง...
        </p>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div
        style={{
          ...glassCard,
          borderRadius: 18,
          padding: "36px 24px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            margin: "0 auto 14px",
            background: "rgba(255,255,255,0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 9l9-6 9 6v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path
              d="M9 22V12h6v10"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h3
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "#fff",
            margin: "0 0 6px",
          }}
        >
          ยังไม่มีห้องที่เปิดอยู่
        </h3>
        <p
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.38)",
            margin: 0,
            fontWeight: 500,
            lineHeight: 1.5,
          }}
        >
          รอผู้จัดสร้างห้อง หรือกรอกรหัสเอง
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
  const host = room.hostName || "โฮสต์";
  const members = room.playerCount ?? 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
      transition={{
        type: "spring",
        stiffness: 320,
        damping: 28,
        delay: Math.min(index * 0.04, 0.25),
      }}
      style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 16,
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 11,
          flexShrink: 0,
          background: avatarColor(host),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 17,
          fontWeight: 800,
          color: "#fff",
        }}
      >
        {host.charAt(0).toUpperCase()}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#fff",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {host}
          </span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              flexShrink: 0,
            }}
          >
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "#22C55E",
                display: "inline-block",
              }}
            />
            <span style={{ fontSize: 10, fontWeight: 700, color: "#4ADE80" }}>
              LIVE
            </span>
          </span>
        </div>
        <div
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.38)",
            fontWeight: 600,
            marginTop: 1,
          }}
        >
          {room.code} · {members} ผู้เล่น · {room.totalQuestions} คำถาม
        </div>
      </div>

      <motion.button
        onClick={onJoin}
        disabled={anyJoining}
        whileHover={!anyJoining ? { scale: 1.04 } : {}}
        whileTap={!anyJoining ? { scale: 0.96 } : {}}
        style={{
          border: "none",
          borderRadius: 10,
          padding: "9px 18px",
          background: accentGradient,
          color: "#fff",
          fontSize: 13,
          fontWeight: 700,
          fontFamily: "inherit",
          cursor: anyJoining ? "not-allowed" : "pointer",
          boxShadow: "0 4px 14px rgba(99,102,241,0.3)",
          opacity: anyJoining && !joining ? 0.45 : 1,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          flexShrink: 0,
          minWidth: 80,
          justifyContent: "center",
        }}
      >
        {joining ? (
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            style={{
              display: "inline-block",
              width: 14,
              height: 14,
              border: "2px solid rgba(255,255,255,0.3)",
              borderTopColor: "#fff",
              borderRadius: "50%",
            }}
          />
        ) : (
          <>
            เข้าร่วม
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="#fff"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </>
        )}
      </motion.button>
    </motion.div>
  );
}
