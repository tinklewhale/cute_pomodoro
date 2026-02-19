import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Item {
  id: string;
  name: string;
  type: 'hair' | 'top' | 'bottom' | 'accessory' | 'background';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic';
  assetUrl: string;
}

interface GameState {
  coins: number;
  inventory: Item[];
  equipped: {
    hair?: string;
    top?: string;
    bottom?: string;
    accessory?: string;
    background?: string;
  };
  
  // Actions
  addCoins: (amount: number) => void;
  addItem: (item: Item) => void;
  equipItem: (type: Item['type'], itemId: string) => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      coins: 0,
      inventory: [],
      equipped: {},

      addCoins: (amount) => set((state) => ({ coins: state.coins + amount })),
      
      addItem: (item) => set((state) => ({ inventory: [...state.inventory, item] })),
      
      equipItem: (type, itemId) => set((state) => ({
        equipped: { ...state.equipped, [type]: itemId }
      })),
    }),
    {
      name: 'pomodoro-game-storage',
    }
  )
);
