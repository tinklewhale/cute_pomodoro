import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Home, Users, CalendarDays, Backpack } from 'lucide-react';
import { useGameStore } from './features/game/useGameStore';
import { useAuthStore } from './features/auth/useAuthStore';
import { CharacterSelect } from './components/character/CharacterSelect';
import { CharacterView } from './components/character/CharacterView';
import { TimerDisplay } from './components/timer/TimerDisplay';
import { ItemRewardPopup } from './components/timer/ItemRewardPopup';
import { RoomView } from './components/room/RoomView';
import { CalendarView } from './components/calendar/CalendarView';
import { InventoryView } from './components/inventory/InventoryView';
import { ShopView } from './components/shop/ShopView';
import { RoomMemberCharacter } from './components/room/RoomMemberCharacter';
import { AuthModal } from './components/auth/AuthModal';
import { AuthPage } from './components/auth/AuthPage';
import { playClick, playNotification } from './utils/audio';
import { rollItemBox } from './data/items';
import { useTimerStore } from './features/timer/useTimerStore';
import { useRoomStore, type MemberTimerStatus } from './features/room/useRoomStore';
import { SESSION_USER_ID } from './utils/sessionId';

type Tab = 'home' | 'room' | 'calendar' | 'inventory';

const NAV_TABS: { id: Tab; labelKo: string; icon: React.ReactNode }[] = [
  { id: 'home',      labelKo: '홈',       icon: <Home       size={20} /> },
  { id: 'room',      labelKo: '친구방',   icon: <Users      size={20} /> },
  { id: 'calendar',  labelKo: '캘린더',   icon: <CalendarDays size={20} /> },
  { id: 'inventory', labelKo: '인벤토리', icon: <Backpack   size={20} /> },
];

function App() {
  const { hasChosenCharacter, coins, selectedCharacter, equipped, nickname, loadFromCloud, clearUserId,
          addCoins, addSessionRecord, setPendingReward, unlockAchievement,
          sessionConflict, resetForNewAccount } = useGameStore();
  const { user, status: authStatus, signOut } = useAuthStore();
  const { tick, status: timerStatus, mode: timerMode, focusStartTime, focusDuration,
          advanceCycle, advanceToFocus,
          timeLeft, cycleInSet, cyclesUntilLongBreak } = useTimerStore();
  const { roomId, members, isConnected, broadcastTimerStatus, broadcastFocusSeconds, broadcastTimerTick, broadcastProfileUpdate, updateMemberProfile, requestProfileSync } = useRoomStore();

  const [tab, setTab]               = useState<Tab>('home');
  const [showShop, setShowShop]     = useState(false);
  const [showAuth, setShowAuth]     = useState(false);
  // true when user explicitly chose to continue without an account
  const [guestAllowed, setGuestAllowed] = useState(false);

  // ── Auth init — bridge auth events → game store ──────────
  useEffect(() => {
    const unsubscribe = useAuthStore.getState().init((userId) => {
      void loadFromCloud(userId);
    });
    return unsubscribe;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Session conflict: 다른 기기 로그인 감지 → 자동 로그아웃 ──
  useEffect(() => {
    if (!sessionConflict) return;
    const t = setTimeout(async () => {
      await signOut();
      clearUserId();
      resetForNewAccount(); // 세션 충돌 로그아웃 시에도 로컬 상태 초기화
    }, 2500);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionConflict]);

  // ── Global tick interval (runs regardless of active tab) ──
  useEffect(() => {
    if (timerStatus !== 'running') return;
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timerStatus, tick]);

  // ── Broadcast profile updates (character & items) ──
  useEffect(() => {
    if (!roomId) return;
    updateMemberProfile(
      SESSION_USER_ID,
      selectedCharacter,
      equipped.background,
      equipped.accessory,
      equipped.skin
    );
    void broadcastProfileUpdate(
      SESSION_USER_ID,
      selectedCharacter,
      equipped.background,
      equipped.accessory,
      equipped.skin
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, selectedCharacter, equipped.background, equipped.accessory, equipped.skin]);

  // ── Request profiles when joining a room ────────────────
  useEffect(() => {
    if (isConnected) {
      void requestProfileSync();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  // ── Handle timer completion ────────────────────────────────
  useEffect(() => {
    if (timerStatus !== 'completed') return;
    playNotification();
    if (timerMode === 'focus') {
      addCoins(50);
      if (focusStartTime) {
        addSessionRecord({ startedAt: focusStartTime.toISOString(), durationSeconds: focusDuration });
      }
      unlockAchievement('ach_first');
      const hour = new Date().getHours();
      if (hour >= 0 && hour < 6) unlockAchievement('ach_night');
      if (hour >= 4 && hour < 6) unlockAchievement('ach_dawn');
      // Sync today's total focus seconds to room
      if (roomId) {
        const todayStr = new Date().toISOString().split('T')[0];
        const todaySeconds = useGameStore.getState().sessionHistory
          .filter((r) => r.date === todayStr)
          .reduce((sum, r) => sum + r.durationSeconds, 0);
        void broadcastFocusSeconds(SESSION_USER_ID, todaySeconds);
      }
      setPendingReward(rollItemBox(selectedCharacter));
      const t = setTimeout(() => advanceCycle(), 1200);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => advanceToFocus(), 1000);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerStatus]);

  // ── Broadcast timer status to room (idle은 3초 디바운스) ──
  const idleBroadcastRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!roomId) return;
    const mapped: MemberTimerStatus =
      timerStatus === 'running'   ? 'running'   :
      timerStatus === 'paused'    ? 'paused'    :
      timerStatus === 'completed' ? 'completed' : 'idle';

    if (mapped === 'idle') {
      // 사이클 전환 중 순간적인 idle 방송 방지 — 3초 후에만 방송
      idleBroadcastRef.current = setTimeout(() => {
        void broadcastTimerStatus(SESSION_USER_ID, 'idle');
      }, 3000);
      return () => {
        if (idleBroadcastRef.current) clearTimeout(idleBroadcastRef.current);
      };
    }
    // running/paused/completed: 대기 중인 idle 방송 취소 후 즉시 방송
    if (idleBroadcastRef.current) {
      clearTimeout(idleBroadcastRef.current);
      idleBroadcastRef.current = null;
    }
    void broadcastTimerStatus(SESSION_USER_ID, mapped);
  }, [timerStatus, roomId, broadcastTimerStatus]);

  // ── 실시간 진행시간 방송 (10초마다, focus 모드 running 중에만) ──
  useEffect(() => {
    if (!roomId || timerStatus !== 'running' || timerMode !== 'focus') return;
    const id = setInterval(() => {
      const { timeLeft: tl, focusDuration: fd } = useTimerStore.getState();
      const { sessionHistory } = useGameStore.getState();
      const todayStr = new Date().toISOString().split('T')[0];
      const base = sessionHistory
        .filter((r) => r.date === todayStr)
        .reduce((sum, r) => sum + r.durationSeconds, 0);
      void broadcastFocusSeconds(SESSION_USER_ID, base + (fd - tl));
    }, 10_000);
    return () => clearInterval(id);
  }, [roomId, timerStatus, timerMode, broadcastFocusSeconds]);

  // ── 타이머 남은 시간 방송 (5초마다, 상대방 카드에 표시용) ──
  useEffect(() => {
    if (!roomId || timerStatus !== 'running') return;

    const tickPayload = () => {
      const state = useTimerStore.getState();
      void broadcastTimerTick(SESSION_USER_ID, state.timeLeft, state.mode, state.cycleInSet, state.cyclesUntilLongBreak);
    };

    // 시작 즉시 한 번 방송
    tickPayload();
    const id = setInterval(tickPayload, 5_000);
    return () => clearInterval(id);
  }, [roomId, timerStatus, broadcastTimerTick]);

  const handleSignOut = async () => {
    playClick();
    await signOut();
    clearUserId();
    resetForNewAccount(); // 이전 계정 데이터가 새 계정에 귀속되지 않도록 로컬 상태 초기화
    setGuestAllowed(false); // return to auth page on logout
  };

  // ── Gate 1: loading (brief — while Supabase checks existing session) ──
  if (authStatus === 'loading') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', background: 'var(--cream)',
      }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          style={{ fontSize: '2.4rem' }}
        >
          🍅
        </motion.div>
      </div>
    );
  }

  // ── Gate 2: not logged in and hasn't chosen guest mode → auth page ──
  if (authStatus === 'guest' && !guestAllowed) {
    return <AuthPage onGuest={() => setGuestAllowed(true)} />;
  }

  // ── Gate 3: logged in (or guest) but no character chosen yet → onboarding ──
  if (!hasChosenCharacter) {
    return <CharacterSelect />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>

      {/* =============================================
          STICKY HEADER
          ============================================= */}
      <header
        style={{
          height: 'var(--header-h)',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-nav)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1.5px solid rgba(255, 255, 255, 0.8)',
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}
      >
        {/* Left: logo + nickname */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <motion.img
            src={`/characters/${selectedCharacter}.png`}
            alt={selectedCharacter}
            whileHover={{ rotate: [0, -8, 8, 0] }}
            transition={{ duration: 0.4 }}
            style={{
              width: 34, height: 34,
              objectFit: 'contain',
              borderRadius: '50%',
              background: 'var(--cream-dark)',
              padding: 2,
            }}
          />
          <div>
            <div style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--rose)', lineHeight: 1 }}>
              Cute Pomodoro
            </div>
            {nickname && (
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', lineHeight: 1, marginTop: 1 }}>
                {nickname}
              </div>
            )}
          </div>
        </div>

        {/* Right: coins + shop + auth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="coin-display">
            🪙 {coins}
          </div>
          <motion.button
            className="btn btn-ghost"
            style={{ padding: '7px 12px', fontSize: '0.82rem' }}
            onClick={() => { playClick(); setShowShop(true); }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🛍️ 상점
          </motion.button>

          {/* Guest: show login button */}
          {authStatus === 'guest' && (
            <motion.button
              className="btn btn-ghost"
              style={{ padding: '7px 12px', fontSize: '0.82rem' }}
              onClick={() => { playClick(); setShowAuth(true); }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ☁️ 로그인
            </motion.button>
          )}

          {/* Authenticated: show avatar + logout */}
          {authStatus === 'authenticated' && user && (
            <motion.button
              className="btn btn-ghost"
              style={{ padding: '6px 10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={handleSignOut}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={user.email ?? ''}
            >
              <div
                style={{
                  width: 22, height: 22,
                  borderRadius: '50%',
                  background: 'var(--rose-grad)',
                  color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.68rem', fontWeight: 900,
                  flexShrink: 0,
                }}
              >
                {(user.email ?? 'U')[0].toUpperCase()}
              </div>
              로그아웃
            </motion.button>
          )}
        </div>
      </header>

      {/* =============================================
          MAIN CONTENT GRID
          ============================================= */}
      <main className="app-main-grid" style={{ flex: 1 }}>

        {/* Left panel — Character (desktop only, sticky) */}
        <aside className="character-panel">
          {tab === 'room' && isConnected ? (
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', alignItems: 'center',
              width: '100%', maxHeight: '80vh', overflowY: 'auto', padding: 10
            }}>
              {members.map(m => (
                <RoomMemberCharacter key={m.userId} member={m} size={members.length > 4 ? 80 : 120} />
              ))}
            </div>
          ) : (
            <>
              <CharacterView size={220} />

              {/* Mini timer display */}
              {timerStatus !== 'idle' && (
                <div style={{ marginTop: 16, textAlign: 'center', width: '100%' }}>
                  {/* Time + mode */}
                  <div style={{
                    fontWeight: 900,
                    fontSize: '1.9rem',
                    color: 'var(--text-primary)',
                    lineHeight: 1,
                    fontVariantNumeric: 'tabular-nums',
                    letterSpacing: '-0.02em',
                  }}>
                    {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
                  </div>
                  <div style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: timerMode === 'focus' ? 'var(--rose)' : timerMode === 'shortBreak' ? '#5EC49A' : '#5BA8E5',
                    marginTop: 4,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    {timerMode === 'focus' ? '집중' : timerMode === 'shortBreak' ? '짧은 휴식' : '긴 휴식'}
                    {timerStatus === 'paused' && ' · 일시정지'}
                  </div>
                  {/* Cycle dots */}
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 8 }}>
                    {Array.from({ length: cyclesUntilLongBreak }).map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ scale: i === cycleInSet && timerStatus === 'running' ? [1, 1.35, 1] : 1 }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        style={{
                          width: 8, height: 8,
                          borderRadius: '50%',
                          background: i < cycleInSet
                            ? (timerMode === 'focus' ? 'var(--rose)' : '#5EC49A')
                            : 'rgba(0,0,0,0.10)',
                          border: i < cycleInSet ? 'none' : '1.5px solid rgba(0,0,0,0.10)',
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div
                style={{
                  marginTop: timerStatus !== 'idle' ? 12 : 20,
                  padding: '8px 20px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(255, 255, 255, 0.6)',
                  border: '1.5px solid rgba(255, 255, 255, 0.85)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                }}
              >
                {selectedCharacter === 'cat' ? '🐱 ' : '🦊 '}
                {nickname}
              </div>
            </>
          )}
        </aside>

        {/* Right panel — Tab content */}
        <section className="content-panel">
          <AnimatePresence mode="wait">
            {tab === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
              >
                <TimerDisplay />
              </motion.div>
            )}

            {tab === 'room' && (
              <motion.div
                key="room"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
              >
                <RoomView />
              </motion.div>
            )}

            {tab === 'calendar' && (
              <motion.div
                key="calendar"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
              >
                <CalendarView />
              </motion.div>
            )}

            {tab === 'inventory' && (
              <motion.div
                key="inventory"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
              >
                <InventoryView />
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* =============================================
          BOTTOM NAVIGATION
          ============================================= */}
      <nav
        style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          height: 'var(--nav-h)',
          background: 'var(--bg-nav)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1.5px solid rgba(255, 255, 255, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          zIndex: 30,
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {NAV_TABS.map(({ id, labelKo, icon }) => {
          const isActive = tab === id;
          return (
            <button
              key={id}
              onClick={() => { playClick(); setTab(id); }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                padding: '8px 20px',
                borderRadius: 'var(--radius-md)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: isActive ? 'var(--rose)' : 'var(--text-muted)',
                position: 'relative',
                transition: 'color 0.2s',
              }}
            >
              <motion.div
                animate={{ scale: isActive ? 1.1 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                {icon}
              </motion.div>
              <span style={{ fontSize: '0.65rem', fontWeight: 800 }}>{labelKo}</span>

              {/* Active indicator */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="nav-pip"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    exit={{ scaleX: 0 }}
                    style={{
                      position: 'absolute',
                      bottom: -1,
                      left: 0, right: 0, margin: '0 auto',
                      width: 24, height: 3,
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--rose)',
                    }}
                  />
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </nav>

      {/* =============================================
          GLOBAL OVERLAYS
          ============================================= */}

      {/* Item reward popup (focus cycle complete) */}
      <ItemRewardPopup />

      {/* Auth modal */}
      <AnimatePresence>
        {showAuth && (
          <AuthModal
            onClose={() => setShowAuth(false)}
            onSuccess={() => {
              setShowAuth(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Session conflict toast */}
      <AnimatePresence>
        {sessionConflict && (
          <motion.div
            key="session-conflict"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed',
              top: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 999,
              background: '#FFF0F3',
              border: '2px solid var(--rose)',
              borderRadius: 'var(--radius-lg)',
              padding: '12px 20px',
              fontWeight: 800,
              fontSize: '0.88rem',
              color: 'var(--rose)',
              boxShadow: 'var(--shadow-lg)',
              textAlign: 'center',
              whiteSpace: 'nowrap',
            }}
          >
            📱 다른 기기에서 로그인되어 자동 로그아웃됩니다...
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shop slide-up sheet */}
      <AnimatePresence>
        {showShop && (
          <>
            <motion.div
              key="shop-bg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed', inset: 0,
                background: 'rgba(61, 44, 44, 0.30)',
                backdropFilter: 'blur(4px)',
                zIndex: 40,
              }}
              onClick={() => setShowShop(false)}
            />
            <motion.div
              key="shop-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              style={{
                position: 'fixed',
                bottom: 0, left: 0, right: 0,
                background: 'var(--cream)',
                borderRadius: '28px 28px 0 0',
                maxHeight: '86vh',
                overflowY: 'auto',
                zIndex: 41,
                boxShadow: '0 -12px 60px rgba(196, 168, 232, 0.22)',
                border: '2px solid rgba(255, 255, 255, 0.85)',
                borderBottom: 'none',
                paddingBottom: 'env(safe-area-inset-bottom)',
              }}
            >
              {/* Handle */}
              <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--cream-dark)', margin: '14px auto 0' }} />
              <ShopView />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
