import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../features/game/useGameStore';
import { ALL_ITEMS, RARITY_LABEL, ITEM_TYPE_LABEL, type ItemType } from '../../data/items';
import { playClick } from '../../utils/audio';
import { CraftingView } from './CraftingView';

type FilterTab = 'all' | ItemType;

const FILTER_TABS: { id: FilterTab; labelKo: string }[] = [
  { id: 'all',        labelKo: '전체' },
  { id: 'background', labelKo: '배경' },
  { id: 'accessory',  labelKo: '악세서리' },
  { id: 'skin',       labelKo: '스킨' },
];

export const InventoryView: React.FC = () => {
  const { inventory, equipped, equipItem, unequipItem, selectedCharacter } = useGameStore();
  const [filter, setFilter] = useState<FilterTab>('all');
  const [showCrafting, setShowCrafting] = useState(false);

  // Group by definitionId with instance tracking
  const itemCounts = new Map<string, { instances: string[]; def: typeof ALL_ITEMS[number] }>();
  for (const inv of inventory) {
    const def = ALL_ITEMS.find((i) => i.id === inv.definitionId);
    if (!def) continue;
    // Skip skins incompatible with current character
    if (def.type === 'skin' && def.compatibleCharacters !== 'all' && !(def.compatibleCharacters as string[]).includes(selectedCharacter)) continue;
    const existing = itemCounts.get(inv.definitionId);
    if (existing) {
      existing.instances.push(inv.instanceId);
    } else {
      itemCounts.set(inv.definitionId, { instances: [inv.instanceId], def });
    }
  }

  const filteredItems = Array.from(itemCounts.values()).filter(
    ({ def }) => filter === 'all' || def.type === filter
  );

  const isEquipped = (defId: string) => Object.values(equipped).includes(defId);

  const handleToggleEquip = (defId: string, type: ItemType) => {
    playClick();
    const slotKey = type === 'background' ? 'background' :
                    type === 'accessory'  ? 'accessory'  : 'skin';
    const currentlyEquipped = equipped[slotKey];
    if (currentlyEquipped === defId) {
      unequipItem(slotKey);
    } else {
      equipItem(slotKey, defId);
    }
  };

  return (
    <div style={{ padding: '16px 16px 0', maxWidth: 500, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontWeight: 900, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
          🎒 인벤토리 ({inventory.length})
        </h2>
        <motion.button
          className="btn btn-mint"
          style={{ padding: '8px 14px', fontSize: '0.82rem' }}
          onClick={() => { playClick(); setShowCrafting(true); }}
          whileHover={{ scale: 1.04, y: -1 }}
          whileTap={{ scale: 0.96 }}
        >
          ⚗️ 합성
        </motion.button>
      </div>

      {/* Filter tabs */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          padding: '4px',
          background: 'rgba(255,255,255,0.6)',
          backdropFilter: 'blur(12px)',
          borderRadius: 'var(--radius-full)',
          border: '1.5px solid rgba(255,255,255,0.85)',
          marginBottom: 16,
        }}
      >
        {FILTER_TABS.map((tab) => {
          const isActive = filter === tab.id;
          return (
            <motion.button
              key={tab.id}
              onClick={() => { playClick(); setFilter(tab.id); }}
              style={{
                flex: 1,
                padding: '7px 4px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                background: isActive ? '#fff' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: isActive ? 'var(--shadow-xs)' : 'none',
                transition: 'all 0.2s',
              }}
              whileTap={{ scale: 0.95 }}
            >
              {tab.labelKo}
            </motion.button>
          );
        })}
      </div>

      {/* Empty state */}
      {filteredItems.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 20px' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>📦</div>
          <p style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {filter === 'all' ? '아직 아이템이 없어요!' : `${ITEM_TYPE_LABEL[filter as ItemType]} 아이템이 없어요!`}
          </p>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6, fontWeight: 600 }}>
            뽀모도로 세션을 완료하거나 상점에서 구매하세요 🍅
          </p>
        </div>
      )}

      {/* Item grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10,
          paddingBottom: 24,
        }}
      >
        {filteredItems.map(({ def, instances }) => {
          const equip = isEquipped(def.id);
          return (
            <motion.button
              key={def.id}
              onClick={() => handleToggleEquip(def.id, def.type)}
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.96 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                padding: '12px 8px',
                borderRadius: 'var(--radius-md)',
                background: equip ? 'rgba(255, 107, 138, 0.08)' : 'rgba(255,255,255,0.65)',
                border: equip ? '2px solid var(--rose)' : '2px solid rgba(255,255,255,0.85)',
                backdropFilter: 'blur(8px)',
                cursor: 'pointer',
                position: 'relative',
                boxShadow: equip ? '0 4px 16px rgba(255, 107, 138, 0.18)' : 'var(--shadow-xs)',
                transition: 'all 0.2s',
              }}
            >
              {/* Equipped badge */}
              {equip && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={{
                    position: 'absolute', top: 6, right: 6,
                    width: 18, height: 18,
                    borderRadius: '50%',
                    background: 'var(--rose)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.6rem',
                    color: '#fff',
                    fontWeight: 900,
                  }}
                >
                  ✓
                </motion.div>
              )}

              {/* Count badge */}
              {instances.length > 1 && (
                <div style={{
                  position: 'absolute', top: 6, left: 6,
                  background: 'rgba(61,44,44,0.65)',
                  color: '#fff',
                  fontSize: '0.6rem',
                  fontWeight: 900,
                  borderRadius: 'var(--radius-full)',
                  padding: '1px 5px',
                }}>
                  ×{instances.length}
                </div>
              )}

              {/* Item display */}
              {def.type === 'background' ? (
                <div style={{
                  width: 52, height: 52,
                  borderRadius: 'var(--radius-sm)',
                  background: def.assetData,
                  border: '2px solid rgba(255,255,255,0.5)',
                  boxShadow: 'var(--shadow-xs)',
                }} />
              ) : (
                <div style={{ fontSize: '2.2rem', lineHeight: 1 }}>{def.emoji}</div>
              )}

              {/* Name */}
              <div style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                textAlign: 'center',
                lineHeight: 1.2,
                wordBreak: 'keep-all',
              }}>
                {def.nameKo}
              </div>

              {/* Rarity */}
              <span className={`rarity-badge rarity-badge--${def.rarity}`} style={{ fontSize: '0.6rem', padding: '2px 6px' }}>
                {RARITY_LABEL[def.rarity].slice(0, 2)}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Crafting slide-up */}
      <AnimatePresence>
        {showCrafting && (
          <>
            <motion.div
              key="craft-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed', inset: 0,
                background: 'rgba(61, 44, 44, 0.30)',
                backdropFilter: 'blur(4px)',
                zIndex: 59,
              }}
              onClick={() => setShowCrafting(false)}
            />
            <CraftingView onClose={() => setShowCrafting(false)} />
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
