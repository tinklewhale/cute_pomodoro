import React, { useState, useEffect } from 'react';
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
import { AuthModal } from './components/auth/AuthModal';
import { playClick } from './utils/audio';

type Tab = 'home' | 'room' | 'calendar' | 'inventory';

const NAV_TABS: { id: Tab; labelKo: string; icon: React.ReactNode }[] = [
  { id: 'home',      labelKo: '홈',       icon: <Home       size={20} /> },
  { id: 'room',      labelKo: '친구방',   icon: <Users      size={20} /> },
  { id: 'calendar',  labelKo: '캘린더',   icon: <CalendarDays size={20} /> },
  { id: 'inventory', labelKo: '인벤토리', icon: <Backpack   size={20} /> },
];

function App() {
  const { hasChosenCharacter, coins, selectedCharacter, nickname, loadFromCloud, clearUserId } = useGameStore();
  const { user, status: authStatus, signOut } = useAuthStore();

  const [tab, setTab]               = useState<Tab>('home');
  const [showShop, setShowShop]     = useState(false);
  const [showAuth, setShowAuth]     = useState(false);

  // ── Auth init — bridge auth events → game store ──────────
  useEffect(() => {
    const unsubscribe = useAuthStore.getState().init((userId) => {
      void loadFromCloud(userId);
    });
    return unsubscribe;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignOut = async () => {
    playClick();
    await signOut();
    clearUserId();
  };

  // ── Onboarding gate ───────────────────────────────────────
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
          <CharacterView size={220} />
          <div
            style={{
              marginTop: 20,
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
                      left: '50%', transform: 'translateX(-50%)',
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
            onSuccess={(userId) => {
              void loadFromCloud(userId);
              setShowAuth(false);
            }}
          />
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
