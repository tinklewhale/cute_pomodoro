import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useGameStore } from '../../features/game/useGameStore';
import { ALL_ITEMS, SYNTHESIS_REQUIRED, synthesizeItems, RARITY_LABEL, type Rarity } from '../../data/items';
import { playClick, playRewardClaim, playError } from '../../utils/audio';

interface CraftingViewProps {
  onClose: () => void;
}

const RARITY_COLORS: Record<Rarity, { bg: string; border: string; text: string; grad: string }> = {
  1: { bg: '#F9FAFB',  border: '#E5E7EB', text: '#6B7280', grad: 'linear-gradient(135deg, #F3F4F6, #E5E7EB)' },
  2: { bg: '#EEF2FF',  border: '#C7D2FE', text: '#4F46E5', grad: 'linear-gradient(135deg, #EEF2FF, #C7D2FE)' },
  3: { bg: '#FEF3C7',  border: '#FDE68A', text: '#92400E', grad: 'linear-gradient(135deg, #FEF3C7, #FDE68A)' },
};

export const CraftingView: React.FC<CraftingViewProps> = ({ onClose }) => {
  const { inventory, selectedCharacter, synthesizeAndConsume } = useGameStore();
  const [selectedRarity, setSelectedRarity] = useState<Rarity | null>(null);
  const [craftResult, setCraftResult] = useState<typeof ALL_ITEMS[number] | null>(null);
  const [crafting, setCrafting] = useState(false);

  // Count items by rarity
  const countByRarity = (r: Rarity) =>
    inventory.filter((inv) => {
      const def = ALL_ITEMS.find((i) => i.id === inv.definitionId);
      return def?.rarity === r;
    }).length;

  const RARITIES: Rarity[] = [1, 2, 3];

  const handleCraft = () => {
    if (!selectedRarity || crafting) return;
    playClick();

    const matchingItems = inventory.filter((inv) => {
      const def = ALL_ITEMS.find((i) => i.id === inv.definitionId);
      return def?.rarity === selectedRarity;
    });

    if (matchingItems.length < SYNTHESIS_REQUIRED) {
      playError();
      return;
    }

    setCrafting(true);

    // Use 10 items
    const toConsume = matchingItems.slice(0, SYNTHESIS_REQUIRED).map((i) => i.instanceId);
    const result = synthesizeItems(selectedRarity, selectedCharacter);

    setTimeout(() => {
      synthesizeAndConsume(toConsume, result);
      setCraftResult(result);
      playRewardClaim();
      setCrafting(false);
    }, 800);
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        background: 'var(--cream)',
        borderRadius: '28px 28px 0 0',
        padding: '8px 20px 32px',
        maxHeight: '82vh',
        overflowY: 'auto',
        zIndex: 60,
        boxShadow: '0 -12px 60px rgba(61, 44, 44, 0.18)',
        border: '2px solid rgba(255, 255, 255, 0.85)',
        borderBottom: 'none',
      }}
    >
      {/* Handle bar */}
      <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--cream-dark)', margin: '12px auto 20px' }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--text-primary)' }}>⚗️ 아이템 합성</h2>
          <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: 2 }}>
            같은 등급 {SYNTHESIS_REQUIRED}개 → 랜덤 아이템 1개 획득
          </p>
        </div>
        <button
          className="btn btn-ghost btn-icon"
          onClick={() => { playClick(); onClose(); }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Probability info */}
      <div
        style={{
          padding: '10px 14px',
          background: 'rgba(126, 219, 183, 0.12)',
          border: '1.5px solid rgba(126, 219, 183, 0.35)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 20,
          fontSize: '0.78rem',
          fontWeight: 700,
          color: 'var(--text-secondary)',
        }}
      >
        💡 상위 등급 아이템이 나올 확률 <strong>50%</strong>! 같은 등급 45%, 하위 등급 5%
      </div>

      {/* Rarity selection */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {RARITIES.map((r) => {
          const count = countByRarity(r);
          const canCraft = count >= SYNTHESIS_REQUIRED;
          const isSelected = selectedRarity === r;
          const colors = RARITY_COLORS[r];

          return (
            <motion.button
              key={r}
              onClick={() => {
                if (!canCraft) { playError(); return; }
                playClick();
                setSelectedRarity(isSelected ? null : r);
                setCraftResult(null);
              }}
              whileHover={canCraft ? { scale: 1.01, y: -1 } : {}}
              whileTap={canCraft ? { scale: 0.98 } : {}}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                background: isSelected ? colors.bg : 'rgba(255,255,255,0.6)',
                border: isSelected
                  ? `2px solid ${colors.border}`
                  : '2px solid rgba(255,255,255,0.85)',
                cursor: canCraft ? 'pointer' : 'not-allowed',
                opacity: canCraft ? 1 : 0.45,
                textAlign: 'left',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.2s',
              }}
            >
              {/* Rarity indicator */}
              <div style={{
                width: 40, height: 40,
                borderRadius: 'var(--radius-sm)',
                background: colors.grad,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.3rem',
                flexShrink: 0,
              }}>
                {'⭐'.repeat(r)}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: colors.text }}>
                  {RARITY_LABEL[r]}
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: 2 }}>
                  {count}개 보유 / {SYNTHESIS_REQUIRED}개 필요
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ width: 56 }}>
                <div style={{
                  height: 5, borderRadius: 3,
                  background: 'rgba(0,0,0,0.07)',
                  overflow: 'hidden',
                }}>
                  <motion.div
                    animate={{ width: `${Math.min((count / SYNTHESIS_REQUIRED) * 100, 100)}%` }}
                    transition={{ duration: 0.5 }}
                    style={{
                      height: '100%',
                      background: canCraft ? colors.grad : 'rgba(0,0,0,0.15)',
                      borderRadius: 3,
                    }}
                  />
                </div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: 2, textAlign: 'right' }}>
                  {Math.min(count, SYNTHESIS_REQUIRED)}/{SYNTHESIS_REQUIRED}
                </div>
              </div>

              {isSelected && (
                <div style={{ fontSize: '0.75rem', color: colors.text, fontWeight: 800 }}>✓</div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Craft button */}
      <motion.button
        className="btn btn-mint"
        style={{
          width: '100%',
          padding: '14px',
          fontSize: '1rem',
          opacity: selectedRarity && !crafting ? 1 : 0.45,
          cursor: selectedRarity && !crafting ? 'pointer' : 'not-allowed',
        }}
        onClick={handleCraft}
        disabled={!selectedRarity || crafting}
        whileHover={selectedRarity && !crafting ? { scale: 1.02, y: -2 } : {}}
        whileTap={selectedRarity && !crafting ? { scale: 0.97 } : {}}
      >
        {crafting ? '합성 중... ✨' : `합성하기! (${SYNTHESIS_REQUIRED}개 사용)`}
      </motion.button>

      {/* Result */}
      <AnimatePresence>
        {craftResult && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.7, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            style={{
              marginTop: 20,
              padding: '20px',
              borderRadius: 'var(--radius-lg)',
              background: RARITY_COLORS[craftResult.rarity].bg,
              border: `2px solid ${RARITY_COLORS[craftResult.rarity].border}`,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: 8 }}>{craftResult.emoji}</div>
            <div style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: 6 }}>
              {craftResult.nameKo}
            </div>
            <span className={`rarity-badge rarity-badge--${craftResult.rarity}`}>
              {RARITY_LABEL[craftResult.rarity]} 획득!
            </span>
            <div style={{ marginTop: 14 }}>
              <button
                className="btn btn-ghost"
                style={{ fontSize: '0.83rem' }}
                onClick={() => { playClick(); setCraftResult(null); setSelectedRarity(null); }}
              >
                닫기
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
