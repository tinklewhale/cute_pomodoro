import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ItemDefinition, CharacterType } from '../../data/items';
import { ACHIEVEMENTS } from '../../data/items';

// =========================================================
// Types
// =========================================================

export interface InventoryItem {
  instanceId: string;   // unique per drop (allows duplicates)
  definitionId: string;
}

export interface SessionRecord {
  date: string;         // ISO date string yyyy-MM-dd
  startedAt: string;    // ISO datetime
  durationSeconds: number;
}

export interface AchievementRecord {
  id: string;
  unlockedAt: string | null; // ISO datetime or null
}

interface EquippedState {
  background: string | null;
  accessory:  string | null;
  skin:       string | null;
}

interface GameState {
  // User identity
  selectedCharacter: CharacterType;
  nickname: string;
  hasChosenCharacter: boolean;

  // Economy
  coins: number;

  // Items
  inventory: InventoryItem[];
  equipped: EquippedState;

  // History
  sessionHistory: SessionRecord[];

  // Achievements
  achievements: AchievementRecord[];

  // Pending reward (item box shown during break)
  pendingReward: ItemDefinition | null;

  // ── Actions ──────────────────────────────────────
  selectCharacter: (char: CharacterType, nick: string) => void;
  addCoins: (amount: number) => void;
  addInventoryItem: (def: ItemDefinition) => void;
  equipItem: (type: keyof EquippedState, definitionId: string) => void;
  unequipItem: (type: keyof EquippedState) => void;
  addSessionRecord: (record: Omit<SessionRecord, 'date'>) => void;
  unlockAchievement: (id: string) => void;
  setPendingReward: (item: ItemDefinition | null) => void;
  claimReward: () => void;
  synthesizeAndConsume: (definitionIds: string[], result: ItemDefinition) => void;
}

// =========================================================
// Store
// =========================================================

function makeInstanceId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

const initialAchievements: AchievementRecord[] = ACHIEVEMENTS.map((a) => ({
  id: a.id,
  unlockedAt: null,
}));

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      selectedCharacter: 'cat',
      nickname: '',
      hasChosenCharacter: false,

      coins: 0,
      inventory: [],
      equipped: { background: null, accessory: null, skin: null },
      sessionHistory: [],
      achievements: initialAchievements,
      pendingReward: null,

      // ── selectCharacter ──────────────────────────
      selectCharacter: (char, nick) =>
        set({ selectedCharacter: char, nickname: nick, hasChosenCharacter: true }),

      // ── addCoins ────────────────────────────────
      addCoins: (amount) =>
        set((s) => ({ coins: Math.max(0, s.coins + amount) })),

      // ── addInventoryItem ─────────────────────────
      addInventoryItem: (def) =>
        set((s) => ({
          inventory: [
            ...s.inventory,
            { instanceId: makeInstanceId(), definitionId: def.id },
          ],
        })),

      // ── equipItem ───────────────────────────────
      equipItem: (type, definitionId) =>
        set((s) => ({ equipped: { ...s.equipped, [type]: definitionId } })),

      // ── unequipItem ──────────────────────────────
      unequipItem: (type) =>
        set((s) => ({ equipped: { ...s.equipped, [type]: null } })),

      // ── addSessionRecord ─────────────────────────
      addSessionRecord: (record) =>
        set((s) => ({
          sessionHistory: [
            ...s.sessionHistory,
            { ...record, date: todayISO() },
          ],
        })),

      // ── unlockAchievement ────────────────────────
      unlockAchievement: (id) => {
        const { achievements } = get();
        const existing = achievements.find((a) => a.id === id);
        if (!existing || existing.unlockedAt !== null) return; // already unlocked

        set((s) => ({
          achievements: s.achievements.map((a) =>
            a.id === id ? { ...a, unlockedAt: new Date().toISOString() } : a
          ),
        }));
      },

      // ── setPendingReward ─────────────────────────
      setPendingReward: (item) => set({ pendingReward: item }),

      // ── claimReward ──────────────────────────────
      claimReward: () => {
        const { pendingReward } = get();
        if (!pendingReward) return;
        get().addInventoryItem(pendingReward);
        // Check 3★ achievement
        if (pendingReward.rarity === 3) {
          get().unlockAchievement('ach_3star');
        }
        set({ pendingReward: null });
      },

      // ── synthesizeAndConsume ─────────────────────
      synthesizeAndConsume: (instanceIds, result) => {
        set((s) => ({
          inventory: [
            ...s.inventory.filter((i) => !instanceIds.includes(i.instanceId)),
            { instanceId: makeInstanceId(), definitionId: result.id },
          ],
        }));
        get().unlockAchievement('ach_craft');
      },
    }),
    {
      name: 'cute-pomodoro-v2',
      // Don't persist pendingReward (it should reset on refresh)
      partialize: (state) => ({
        selectedCharacter: state.selectedCharacter,
        nickname:          state.nickname,
        hasChosenCharacter: state.hasChosenCharacter,
        coins:             state.coins,
        inventory:         state.inventory,
        equipped:          state.equipped,
        sessionHistory:    state.sessionHistory,
        achievements:      state.achievements,
      }),
    }
  )
);
