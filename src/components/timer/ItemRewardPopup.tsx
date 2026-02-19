import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../features/game/useGameStore';
import { RARITY_LABEL } from '../../data/items';
import { playRewardClaim } from '../../utils/audio';

export const ItemRewardPopup: React.FC = () => {
  const { pendingReward, claimReward, setPendingReward } = useGameStore();
  const [opened, setOpened] = useState(false);
  const [claimed, setClaimed] = useState(false);

  // Reset state when a new reward appears
  React.useEffect(() => {
    if (pendingReward) {
      setOpened(false);
      setClaimed(false);
    }
  }, [pendingReward]);

  if (!pendingReward) return null;

  const handleOpenBox = () => {
    setOpened(true);
  };

  const handleClaim = () => {
    playRewardClaim();
    setClaimed(true);
    setTimeout(() => {
      claimReward();
    }, 600);
  };

  const handleSkip = () => {
    setPendingReward(null);
  };

  const rarityColors: Record<number, { bg: string; border: string; text: string }> = {
    1: { bg: '#F9FAFB', border: '#E5E7EB', text: '#6B7280' },
    2: { bg: '#EEF2FF', border: '#C7D2FE', text: '#4F46E5' },
    3: { bg: 'linear-gradient(135deg, #FEF3C7, #FDE68A)', border: '#FDE68A', text: '#92400E' },
  };
  const rarityColor = rarityColors[pendingReward.rarity];

  return (
    <AnimatePresence>
      <motion.div
        key="reward-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(61, 44, 44, 0.45)',
          backdropFilter: 'blur(8px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <motion.div
          initial={{ scale: 0.7, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          style={{
            background: 'var(--cream)',
            borderRadius: 'var(--radius-xl)',
            padding: '32px 28px',
            width: '100%',
            maxWidth: 360,
            textAlign: 'center',
            boxShadow: '0 24px 80px rgba(61, 44, 44, 0.25)',
            border: '2px solid rgba(255, 255, 255, 0.85)',
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: 6 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              🎁 아이템 박스 도착!
            </span>
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: 6 }}>
            세션 완료 보상
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 24 }}>
            휴식이 끝나기 전에 받아야 해요!
          </p>

          {!opened ? (
            /* Closed box */
            <>
              <motion.div
                animate={{ y: [0, -12, 0], rotate: [-3, 3, -3] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                style={{ fontSize: '6rem', marginBottom: 24, cursor: 'pointer' }}
                onClick={handleOpenBox}
              >
                🎁
              </motion.div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 20 }}>
                박스를 탭해서 열어보세요!
              </p>

              <motion.button
                className="btn btn-primary"
                style={{ width: '100%', padding: '13px', fontSize: '1rem' }}
                onClick={handleOpenBox}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                열기 ✨
              </motion.button>

              <button
                onClick={handleSkip}
                style={{
                  marginTop: 12,
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                나중에 받기 (취소)
              </button>
            </>
          ) : !claimed ? (
            /* Opened — show item */
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 320, damping: 18 }}
            >
              {/* Sparkle effect */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0, 1, 0.8] }}
                transition={{ duration: 0.6 }}
                style={{ fontSize: '2rem', marginBottom: 8 }}
              >
                ✨🎊✨
              </motion.div>

              {/* Item card */}
              <div
                style={{
                  padding: '20px 16px',
                  borderRadius: 'var(--radius-lg)',
                  background: rarityColor.bg,
                  border: `2px solid ${rarityColor.border}`,
                  marginBottom: 20,
                }}
              >
                <div style={{ fontSize: '3.5rem', marginBottom: 8 }}>
                  {pendingReward.emoji}
                </div>
                <div style={{ fontWeight: 900, fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: 6 }}>
                  {pendingReward.nameKo}
                </div>
                <span className={`rarity-badge rarity-badge--${pendingReward.rarity}`}>
                  {RARITY_LABEL[pendingReward.rarity]}
                </span>
              </div>

              <motion.button
                className="btn btn-primary"
                style={{ width: '100%', padding: '13px', fontSize: '1rem' }}
                onClick={handleClaim}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                받기! 🎉
              </motion.button>
            </motion.div>
          ) : (
            /* Claimed */
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 260 }}
            >
              <div style={{ fontSize: '4rem', marginBottom: 12 }}>🌟</div>
              <p style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--rose)' }}>
                인벤토리에 추가됐어요!
              </p>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
