// =========================================================
// CUTE POMODORO — Item Definitions
// =========================================================

export type Rarity = 1 | 2 | 3; // 1★ 일반 / 2★ 레어 / 3★ 전설
export type ItemType = 'background' | 'accessory' | 'skin' | 'character';
export type CharacterType = 'cat' | 'fox';

export interface ItemDefinition {
  id: string;
  nameKo: string;
  type: ItemType;
  rarity: Rarity;
  compatibleCharacters: 'all' | CharacterType[];
  /** For backgrounds: CSS gradient string. For accessories: emoji string. For skins: CSS filter string */
  assetData: string;
  emoji: string; // for display in inventory/popup
}

// =========================================================
// ITEM POOL
// =========================================================

export const ALL_ITEMS: ItemDefinition[] = [
  // ── 1★ Backgrounds ────────────────────────────────────
  {
    id: 'bg_morning',
    nameKo: '아침 햇살',
    type: 'background',
    rarity: 1,
    compatibleCharacters: 'all',
    assetData: 'linear-gradient(160deg, #FFECD2 0%, #FCB69F 100%)',
    emoji: '🌅',
  },
  {
    id: 'bg_night',
    nameKo: '별이 빛나는 밤',
    type: 'background',
    rarity: 1,
    compatibleCharacters: 'all',
    assetData: 'linear-gradient(160deg, #2C3E72 0%, #4A2C7A 100%)',
    emoji: '🌙',
  },
  {
    id: 'bg_forest',
    nameKo: '숲속 산책',
    type: 'background',
    rarity: 1,
    compatibleCharacters: 'all',
    assetData: 'linear-gradient(160deg, #D4EDDA 0%, #A8D8A8 100%)',
    emoji: '🌿',
  },
  {
    id: 'bg_cloud',
    nameKo: '뭉게구름',
    type: 'background',
    rarity: 1,
    compatibleCharacters: 'all',
    assetData: 'linear-gradient(160deg, #E0F2FE 0%, #BAE6FD 100%)',
    emoji: '☁️',
  },

  // ── 2★ Backgrounds ────────────────────────────────────
  {
    id: 'bg_sakura',
    nameKo: '벚꽃 흩날리는 봄',
    type: 'background',
    rarity: 2,
    compatibleCharacters: 'all',
    assetData: 'linear-gradient(160deg, #FFB7C5 0%, #FFC8DD 50%, #FFE4E8 100%)',
    emoji: '🌸',
  },
  {
    id: 'bg_aurora',
    nameKo: '오로라 하늘',
    type: 'background',
    rarity: 2,
    compatibleCharacters: 'all',
    assetData: 'linear-gradient(160deg, #1A1A2E 0%, #16213E 30%, #0F3460 60%, #533483 100%)',
    emoji: '✨',
  },

  // ── 3★ Backgrounds ────────────────────────────────────
  {
    id: 'bg_galaxy',
    nameKo: '은하수 속으로',
    type: 'background',
    rarity: 3,
    compatibleCharacters: 'all',
    assetData: 'linear-gradient(160deg, #0C0C1E 0%, #1A0533 30%, #0D1B4B 60%, #240046 100%)',
    emoji: '🌌',
  },
  {
    id: 'bg_rainbow',
    nameKo: '무지개 세상',
    type: 'background',
    rarity: 3,
    compatibleCharacters: 'all',
    assetData: 'linear-gradient(160deg, #FFB3BA 0%, #FFDFBA 20%, #FFFFBA 40%, #BAFFC9 60%, #BAE1FF 80%, #E8BAFF 100%)',
    emoji: '🌈',
  },

  // ── 1★ Accessories ────────────────────────────────────
  {
    id: 'acc_glasses',
    nameKo: '동그란 안경',
    type: 'accessory',
    rarity: 1,
    compatibleCharacters: 'all',
    assetData: '👓',
    emoji: '👓',
  },
  {
    id: 'acc_cap',
    nameKo: '파란 야구모자',
    type: 'accessory',
    rarity: 1,
    compatibleCharacters: 'all',
    assetData: '🧢',
    emoji: '🧢',
  },
  {
    id: 'acc_ribbon',
    nameKo: '핑크 리본',
    type: 'accessory',
    rarity: 1,
    compatibleCharacters: 'all',
    assetData: '🎀',
    emoji: '🎀',
  },

  // ── 2★ Accessories ────────────────────────────────────
  {
    id: 'acc_halo',
    nameKo: '황금 후광',
    type: 'accessory',
    rarity: 2,
    compatibleCharacters: 'all',
    assetData: '😇',
    emoji: '✨',
  },
  {
    id: 'acc_flower',
    nameKo: '꽃 화관',
    type: 'accessory',
    rarity: 2,
    compatibleCharacters: 'all',
    assetData: '💐',
    emoji: '🌺',
  },

  // ── 3★ Accessories ────────────────────────────────────
  {
    id: 'acc_crown',
    nameKo: '황금 왕관',
    type: 'accessory',
    rarity: 3,
    compatibleCharacters: 'all',
    assetData: '👑',
    emoji: '👑',
  },
  {
    id: 'acc_wings',
    nameKo: '천사 날개',
    type: 'accessory',
    rarity: 3,
    compatibleCharacters: 'all',
    assetData: '🪽',
    emoji: '🪽',
  },

  // ── 1★ Skins ──────────────────────────────────────────
  {
    id: 'skin_cat_pink',
    nameKo: '핑크 스킨',
    type: 'skin',
    rarity: 1,
    compatibleCharacters: 'all',
    assetData: 'hue-rotate(330deg) saturate(1.4) brightness(1.05)',
    emoji: '🩷',
  },
  {
    id: 'skin_fox_purple',
    nameKo: '보라 스킨',
    type: 'skin',
    rarity: 1,
    compatibleCharacters: 'all',
    assetData: 'hue-rotate(270deg) saturate(1.3)',
    emoji: '💜',
  },

  // ── 2★ Skins ──────────────────────────────────────────
  {
    id: 'skin_cat_blue',
    nameKo: '파랑 스킨',
    type: 'skin',
    rarity: 2,
    compatibleCharacters: 'all',
    assetData: 'hue-rotate(200deg) saturate(1.5) brightness(1.1)',
    emoji: '💙',
  },
  {
    id: 'skin_fox_gold',
    nameKo: '황금 스킨',
    type: 'skin',
    rarity: 2,
    compatibleCharacters: 'all',
    assetData: 'sepia(0.6) hue-rotate(10deg) saturate(1.8) brightness(1.15)',
    emoji: '✨',
  },

  // ── 3★ Skins ──────────────────────────────────────────
  {
    id: 'skin_cat_galaxy',
    nameKo: '은하수 스킨',
    type: 'skin',
    rarity: 3,
    compatibleCharacters: 'all',
    assetData: 'hue-rotate(240deg) saturate(2) brightness(1.2) contrast(1.1)',
    emoji: '🌌',
  },
  {
    id: 'skin_fox_rainbow',
    nameKo: '무지개 스킨',
    type: 'skin',
    rarity: 3,
    compatibleCharacters: 'all',
    assetData: 'hue-rotate(180deg) saturate(2.2) brightness(1.15)',
    emoji: '🌈',
  },

  // ── 3★ Characters ──────────────────────────────────────
  {
    id: 'char_cat',
    nameKo: '고양이',
    type: 'character',
    rarity: 3,
    compatibleCharacters: 'all',
    assetData: 'cat.png',
    emoji: '🐱',
  },
  {
    id: 'char_fox',
    nameKo: '여우',
    type: 'character',
    rarity: 3,
    compatibleCharacters: 'all',
    assetData: 'fox.png',
    emoji: '🦊',
  },
];

// =========================================================
// GACHA LOGIC
// =========================================================

export const ROLL_RATES = { 1: 70, 2: 20, 3: 10 } as const;

export function rollItemBox(_character: CharacterType): ItemDefinition {
  const rand = Math.random() * 100;
  let targetRarity: Rarity;

  if (rand < 70)      targetRarity = 1;
  else if (rand < 90) targetRarity = 2;
  else                targetRarity = 3;

  // Character items are excluded from random gacha (obtained only via synthesis)
  const pool = ALL_ITEMS.filter(
    i => i.rarity === targetRarity && i.type !== 'character'
  );

  const fallback = ALL_ITEMS.filter(i => i.rarity === 1 && i.type !== 'character');
  const finalPool = pool.length > 0 ? pool : fallback;
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

// =========================================================
// SYNTHESIS / CRAFTING LOGIC
// =========================================================

export const SYNTHESIS_REQUIRED = 10; // same-rarity items needed

/**
 * Synthesize SYNTHESIS_REQUIRED items of `inputRarity` into one new item.
 * Result rarity distribution:
 *   - Same rarity (inputRarity): 45%
 *   - +1 rarity:                 50%   (capped at 3)
 *   - -1 rarity (penalty):        5%   (only when inputRarity >= 2)
 */
export function synthesizeItems(inputRarity: Rarity, _character: CharacterType): ItemDefinition {
  const rand = Math.random() * 100;
  let outputRarity: Rarity;

  if (rand < 5 && inputRarity > 1) {
    outputRarity = (inputRarity - 1) as Rarity;
  } else if (rand < 55 && inputRarity < 3) {
    outputRarity = (inputRarity + 1) as Rarity;
  } else {
    outputRarity = inputRarity;
  }

  // 3★ synthesis has a 20% chance to yield a character item
  if (outputRarity === 3 && Math.random() < 0.2) {
    const charPool = ALL_ITEMS.filter(i => i.type === 'character');
    return charPool[Math.floor(Math.random() * charPool.length)];
  }

  const pool = ALL_ITEMS.filter(i => i.rarity === outputRarity && i.type !== 'character');
  const fallback = ALL_ITEMS.filter(i => i.rarity === 1 && i.type !== 'character');
  const finalPool = pool.length > 0 ? pool : fallback;
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

// =========================================================
// ACHIEVEMENTS
// =========================================================

export interface AchievementDefinition {
  id: string;
  nameKo: string;
  descKo: string;
  emoji: string;
  rewardCoins: number;
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'ach_first',
    nameKo: '퍼스트!',
    descKo: '첫 번째 집중 세션을 완료하세요',
    emoji: '⭐',
    rewardCoins: 50,
  },
  {
    id: 'ach_streak3',
    nameKo: '핫스트릭',
    descKo: '3일 연속 집중 세션 완료',
    emoji: '🔥',
    rewardCoins: 100,
  },
  {
    id: 'ach_streak7',
    nameKo: '불꽃 학습자',
    descKo: '7일 연속 집중 세션 완료',
    emoji: '🔥',
    rewardCoins: 300,
  },
  {
    id: 'ach_speed',
    nameKo: '스피드러너',
    descKo: '30분 이내에 4사이클 완주',
    emoji: '🏃',
    rewardCoins: 200,
  },
  {
    id: 'ach_scholar',
    nameKo: '학자',
    descKo: '이번 달 총 100시간 집중',
    emoji: '📚',
    rewardCoins: 500,
  },
  {
    id: 'ach_night',
    nameKo: '야간학습자',
    descKo: '자정(0시) 이후에 세션을 완료하세요',
    emoji: '🌟',
    rewardCoins: 80,
  },
  {
    id: 'ach_dawn',
    nameKo: '새벽학습자',
    descKo: '오전 6시 이전에 세션을 완료하세요',
    emoji: '🌅',
    rewardCoins: 80,
  },
  {
    id: 'ach_craft',
    nameKo: '연금술사',
    descKo: '처음으로 아이템 합성에 성공하세요',
    emoji: '⚗️',
    rewardCoins: 150,
  },
  {
    id: 'ach_friends',
    nameKo: '소셜버터플라이',
    descKo: '친구 방을 만들거나 참여하세요',
    emoji: '👥',
    rewardCoins: 100,
  },
  {
    id: 'ach_3star',
    nameKo: '컬렉터',
    descKo: '3★ 전설 아이템을 획득하세요',
    emoji: '👑',
    rewardCoins: 200,
  },
];

export function getItemById(id: string): ItemDefinition | undefined {
  return ALL_ITEMS.find(i => i.id === id);
}

export const RARITY_LABEL: Record<Rarity, string> = {
  1: '1★ 일반',
  2: '2★ 레어',
  3: '3★ 전설',
};

export const ITEM_TYPE_LABEL: Record<ItemType, string> = {
  background: '배경',
  accessory: '악세서리',
  skin: '스킨',
  character: '캐릭터',
};
