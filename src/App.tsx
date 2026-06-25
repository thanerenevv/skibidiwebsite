import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { WebGLShader } from './components/ui/web-gl-shader';

import HomePage from './pages/HomePage';
import PlayerJoinPage from './pages/PlayerJoinPage';
import PlayerWaitingPage from './pages/PlayerWaitingPage';
import PlayerQuestionPage from './pages/PlayerQuestionPage';
import HostDashboardPage from './pages/HostDashboardPage';
import HostQuestionPage from './pages/HostQuestionPage';
import LeaderboardPage from './pages/LeaderboardPage';
import FinalLeaderboardPage from './pages/FinalLeaderboardPage';

import type { NavState, AppView } from './types';

const pageVariants = {
  initial: { opacity: 0, y: 24 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -24 },
};

const pageTransition = { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const };

function PageWrap({ children, id }: { children: React.ReactNode; id: string }) {
  return (
    <motion.div
      key={id}
      variants={pageVariants}
      initial="initial"
      animate="enter"
      exit="exit"
      transition={pageTransition}
      style={{ minHeight: '100vh', width: '100%', position: 'relative', zIndex: 2 }}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  const [nav, setNav] = useState<NavState>(() => {
    try {
      const playerData = localStorage.getItem('quiztime_player');
      if (playerData) {
        const { gameCode, playerId, nickname } = JSON.parse(playerData);
        if (gameCode && playerId && nickname) {
          return { view: 'player-waiting', gameCode, playerId, playerNickname: nickname };
        }
      }
    } catch { /* ignore */ }
    return { view: 'home', gameCode: null, playerId: null, playerNickname: null };
  });

  const navigate = useCallback((view: AppView, extras?: Partial<NavState>) => {
    setNav((prev) => ({ ...prev, view, ...extras }));
  }, []);

  const handleHostGameStarted = useCallback(
    (gameCode: string) => navigate('host-question', { gameCode }),
    [navigate],
  );

  const handlePlayerJoined = useCallback(
    (gameCode: string, playerId: string, nickname: string) => {
      navigate('player-waiting', { gameCode, playerId, playerNickname: nickname });
    },
    [navigate],
  );

  function handlePlayAgain() {
    localStorage.removeItem('quiztime_player');
    localStorage.removeItem('quiztime_host');
    navigate('home', { gameCode: null, playerId: null, playerNickname: null });
  }

  const { view, gameCode, playerId, playerNickname } = nav;

  return (
    <>
    {/* Persistent shader + vignette behind every page */}
    <WebGLShader />
    <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.62) 100%)', pointerEvents: 'none', zIndex: 1 }} />
    <AnimatePresence mode="wait" initial={false}>
      {view === 'home' && (
        <PageWrap id="home">
          <HomePage
            onHostGame={() => navigate('host-dashboard')}
            onJoinGame={() => navigate('player-join')}
            onJoinRoom={(code) => navigate('player-join', { initialGameCode: code })}
          />
        </PageWrap>
      )}

      {view === 'player-join' && (
        <PageWrap id="player-join">
          <PlayerJoinPage
            initialCode={nav.initialGameCode ?? undefined}
            onJoined={handlePlayerJoined}
            onBack={() => navigate('home')}
          />
        </PageWrap>
      )}

      {view === 'player-waiting' && gameCode && playerId && playerNickname && (
        <PageWrap id="player-waiting">
          <PlayerWaitingPage
            gameCode={gameCode}
            nickname={playerNickname}
            playerId={playerId}
            onGameStarted={() => navigate('player-question')}
            onGameEnded={() => {
              localStorage.removeItem('quiztime_player');
              navigate('home');
            }}
            onLeave={() => {
              localStorage.removeItem('quiztime_player');
              navigate('home', { gameCode: null, playerId: null, playerNickname: null });
            }}
          />
        </PageWrap>
      )}

      {view === 'player-question' && gameCode && playerId && (
        <PageWrap id="player-question">
          <PlayerQuestionPage
            gameCode={gameCode}
            playerId={playerId}
            onLeaderboard={() => navigate('player-leaderboard')}
            onGameFinished={() => {
              localStorage.removeItem('quiztime_player');
              navigate('player-final');
            }}
          />
        </PageWrap>
      )}

      {view === 'player-leaderboard' && gameCode && (
        <PageWrap id="player-leaderboard">
          <LeaderboardPage
            gameCode={gameCode}
            isHost={false}
            playerId={playerId ?? undefined}
            onNextQuestion={() => navigate('player-question')}
            onGameFinished={() => navigate('player-final')}
          />
        </PageWrap>
      )}

      {view === 'player-final' && gameCode && (
        <PageWrap id="player-final">
          <FinalLeaderboardPage
            gameCode={gameCode}
            playerId={playerId ?? undefined}
            onPlayAgain={handlePlayAgain}
          />
        </PageWrap>
      )}

      {view === 'host-dashboard' && (
        <PageWrap id="host-dashboard">
          <HostDashboardPage
            onGameStarted={handleHostGameStarted}
            onBack={() => {
              localStorage.removeItem('quiztime_host');
              navigate('home', { gameCode: null });
            }}
          />
        </PageWrap>
      )}

      {view === 'host-question' && gameCode && (
        <PageWrap id="host-question">
          <HostQuestionPage
            gameCode={gameCode}
            onLeaderboard={() => navigate('host-leaderboard')}
            onGameFinished={() => {
              localStorage.removeItem('quiztime_host');
              navigate('host-final');
            }}
          />
        </PageWrap>
      )}

      {view === 'host-leaderboard' && gameCode && (
        <PageWrap id="host-leaderboard">
          <LeaderboardPage
            gameCode={gameCode}
            isHost={true}
            onNextQuestion={() => navigate('host-question')}
            onGameFinished={() => navigate('host-final')}
          />
        </PageWrap>
      )}

      {view === 'host-final' && gameCode && (
        <PageWrap id="host-final">
          <FinalLeaderboardPage
            gameCode={gameCode}
            onPlayAgain={handlePlayAgain}
          />
        </PageWrap>
      )}
    </AnimatePresence>
    </>
  );
}
