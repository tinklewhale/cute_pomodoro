import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../features/game/useGameStore';
import { ALL_ITEMS, rollItemBox, RARITY_LABEL, type Rarity, type ItemDefinition } from '../../data/items';
import { playClick, playNotification, playError } from '../../utils/audio';

const BOX_TIERS = [
  {
    id: 'normal' as const,
    nameKo: '일반 박스',
    cost: 100,
    descKo: '1★ 70%  /  2★ 20%  /  3★ 10%',
    emoji: '📦',
    gradient: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)',
    border: '#E5E7EB',
  },
  {
    id: 'premium' as const,
    nameKo: '프리미엄 박스',
    cost: 300,
    descKo: '1★ 40%  /  2★ 40%  /  3★ 20%',
    emoji: '✨',
    gradient: 'linear-gradient(135deg, #EEF2FF 0%, #C7D2FE 100%)',
    border: '#C7D2FE',
  },
  {
    id: 'legendary' as const,
    nameKo: '전설 박스',
    cost: 600,
    descKo: '2★ 50%  /  3★ 50%',
    emoji: '🌟',
    gradient: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
    border: '#FDE68A',
  },
] as const;

type BoxTierId = typeof BOX_TIERS[number]['id'];

function rollByTier(tierId: BoxTierId, character: 'cat' | 'fox'): ItemDefinition {
  if (tierId === 'normal') return rollItemBox(character);

  const rand = Math.random() * 100;
  let targetRarity: Rarity;

  if (tierId === 'premium') {
    targetRarity = rand < 40 ? 1 : rand < 80 ? 2 : 3;
  } else {
    targetRarity = rand < 50 ? 2 : 3;
  }

  const pool = ALL_ITEMS.filter((i) => i.rarity === targetRarity && i.type !== 'character');
  const fallback = ALL_ITEMS.filter((i) => i.rarity === 1 && i.type !== 'character');
  const finalPool = pool.length > 0 ? pool : fallback;
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

export const ShopView: React.FC = () => {
  const { coins, addCoins, addInventoryItem, selectedCharacter } = useGameStore();
  const [result, setResult] = useState<{ nameKo: string; rarity: Rarity; emoji: string } | null>(null);
  const [opening, setOpening] = useState(false);

  const handleBuy = (tier: typeof BOX_TIERS[number]) => {
    playClick();
    if (coins < tier.cost) { playError(); return; }
    if (opening) return;

    setOpening(true);
    setResult(null);
    addCoins(-tier.cost);

    setTimeout(() => {
      const item = rollByTier(tier.id, selectedCharacter);
      addInventoryItem(item);
      setResult({ nameKo: item.nameKo, rarity: item.rarity, emoji: item.emoji });
      playNotification();
      setOpening(false);
    }, 700);
  };

  return (
    <div style={{ padding: '20px 20px 28px', maxWidth: 480, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h2 style={{ fontWeight: 900, fontSize: '1.3rem', color: 'var(--text-primary)', marginBottom: 4 }}>
          🛍️ 상점
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          코인으로 아이템 박스를 구매하세요
        </p>
      </div>

      {/* Coin balance */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
        <div className="coin-display" style={{ fontSize: '1rem', padding: '8px 20px' }}>
          🪙 {coins} 코인
        </div>
      </div>

      {/* Earn hint */}
      <div style={{
        padding: '10px 14px',
        background: 'rgba(126, 219, 183, 0.12)',
        border: '1.5px solid rgba(126, 219, 183, 0.35)',
        borderRadius: 'var(--radius-md)',
        fontSize: '0.78rem',
        fontWeight: 700,
        color: 'var(--text-secondary)',
        marginBottom: 20,
      }}>
        💡 집중 세션 완료 시 50코인 획득! 업적 달성 시 추가 보너스!
      </div>

      {/* Box tiers */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {BOX_TIERS.map((tier) => {
          const canAfford = coins >= tier.cost;
          return (
            <motion.div
              key={tier.id}
              className="glass-card"
              style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
            >
              {/* Box icon */}
              <div style={{
                width: 60, height: 60, flexShrink: 0,
                borderRadius: 'var(--radius-md)',
                background: tier.gradient,
                border: `1.5px solid ${tier.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.8rem',
              }}>
                {tier.emoji}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 900, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 2 }}>
                  {tier.nameKo}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 6 }}>
                  {tier.descKo}
                </div>
                <div className="coin-display" style={{ fontSize: '0.78rem', padding: '3px 10px', display: 'inline-flex' }}>
                  🪙 {tier.cost}
                </div>
              </div>

              {/* Buy button */}
              <motion.button
                onClick={() => handleBuy(tier)}
                disabled={!canAfford || opening}
                style={{
                  flexShrink: 0,
                  padding: '9px 16px',
                  borderRadius: 'var(--radius-full)',
                  background: canAfford ? 'var(--rose-grad)' : 'rgba(0,0,0,0.08)',
                  color: canAfford ? '#fff' : 'var(--text-muted)',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  border: 'none',
                  cursor: canAfford && !opening ? 'pointer' : 'not-allowed',
                  opacity: canAfford && !opening ? 1 : 0.55,
                  boxShadow: canAfford ? 'var(--shadow-rose)' : 'none',
                  transition: 'all 0.2s',
                }}
                whileHover={canAfford && !opening ? { scale: 1.05 } : {}}
                whileTap={canAfford && !opening ? { scale: 0.95 } : {}}
              >
                {opening ? '...' : '구매'}
              </motion.button>
            </motion.div>
          );
        })}
      </div>

      {/* Result reveal */}
      <AnimatePresence>
        {result && (
          <motion.div
            key="shop-result"
            initial={{ opacity: 0, scale: 0.7, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            style={{
              padding: '20px',
              borderRadius: 'var(--radius-lg)',
              background:
                result.rarity === 3 ? 'linear-gradient(135deg, #FEF3C7, #FDE68A)' :
                result.rarity === 2 ? '#EEF2FF' : '#F9FAFB',
              border: `2px solid ${result.rarity === 3 ? '#FDE68A' : result.rarity === 2 ? '#C7D2FE' : '#E5E7EB'}`,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: 8 }}>{result.emoji}</div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 4 }}>획득!</p>
            <p style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: 8 }}>
              {result.nameKo}
            </p>
            <span className={`rarity-badge rarity-badge--${result.rarity}`}>
              {RARITY_LABEL[result.rarity]}
            </span>
            <div style={{ marginTop: 14 }}>
              <button
                className="btn btn-ghost"
                style={{ fontSize: '0.82rem' }}
                onClick={() => { playClick(); setResult(null); }}
              >
                닫기
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
