import type { Item } from '../features/game/useGameStore';

export const ALL_ITEMS: Item[] = [
  // Common (70%)
  { id: 'bg_morning', name: 'Morning Sun', type: 'background', rarity: 'common', assetUrl: 'linear-gradient(to top, #a18cd1 0%, #fbc2eb 100%)' },
  { id: 'bg_night', name: 'Starry Night', type: 'background', rarity: 'common', assetUrl: 'linear-gradient(to top, #30cfd0 0%, #330867 100%)' },
  
  // Uncommon (20%)
  { id: 'acc_glasses', name: 'Round Glasses', type: 'accessory', rarity: 'uncommon', assetUrl: 'glasses' },
  { id: 'acc_cap', name: 'Blue Cap', type: 'accessory', rarity: 'uncommon', assetUrl: 'cap' },
  
  // Rare (8%)
  { id: 'outfit_ninja', name: 'Ninja Suit', type: 'top', rarity: 'rare', assetUrl: 'ninja' },
  
  // Epic (2%)
  { id: 'acc_crown', name: 'Golden Crown', type: 'accessory', rarity: 'epic', assetUrl: 'crown' },
];

export const GACHA_COST = 100;

export const rollGacha = (): Item => {
  const rand = Math.random() * 100;
  let pool: Item[] = [];
  
  if (rand < 70) { // Common
    pool = ALL_ITEMS.filter(i => i.rarity === 'common');
  } else if (rand < 90) { // Uncommon
    pool = ALL_ITEMS.filter(i => i.rarity === 'uncommon');
  } else if (rand < 98) { // Rare
    pool = ALL_ITEMS.filter(i => i.rarity === 'rare');
  } else { // Epic
    pool = ALL_ITEMS.filter(i => i.rarity === 'epic');
  }
  
  // Fallback if empty pool (e.g. no epics defined yet)
  if (pool.length === 0) pool = ALL_ITEMS.filter(i => i.rarity === 'common');
  
  return pool[Math.floor(Math.random() * pool.length)];
};
