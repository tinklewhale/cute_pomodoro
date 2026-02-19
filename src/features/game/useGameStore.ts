import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ItemDefinition, CharacterType } from '../../data/items';
import { ACHIEVEMENTS } from '../../data/items';
import { supabase } from '../../lib/supabase';

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

  // Cloud sync
  userId: string | null;  // null = guest
  isSyncing: boolean;

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
  synthesizeAndConsume: (instanceIds: string[], result: ItemDefinition) => void;

  // Cloud sync actions
  loadFromCloud: (userId: string) => Promise<void>;
  clearUserId: () => void;
}

// =========================================================
// Helpers
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

// ── Fire-and-forget cloud sync helpers ──────────────────────
// These run in the background after local state is updated.

function syncProfile(userId: string, s: GameState) {
  void supabase.from('user_profiles').upsert(
    {
      user_id:              userId,
      nickname:             s.nickname,
      selected_character:   s.selectedCharacter,
      has_chosen_character: s.hasChosenCharacter,
      coins:                s.coins,
      equipped_background:  s.equipped.background,
      equipped_accessory:   s.equipped.accessory,
      equipped_skin:        s.equipped.skin,
      updated_at:           new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
}

function syncInventoryFull(userId: string, inventory: InventoryItem[]) {
  // Delete all rows then re-insert (simpler than diffing for small sets)
  void supabase
    .from('user_inventory')
    .delete()
    .eq('user_id', userId)
    .then(() => {
      if (inventory.length === 0) return;
      void supabase.from('user_inventory').insert(
        inventory.map((i) => ({
          user_id:       userId,
          instance_id:   i.instanceId,
          definition_id: i.definitionId,
        })),
      );
    });
}

function syncSessionAppend(userId: string, record: SessionRecord) {
  void supabase.from('user_sessions').insert({
    user_id:          userId,
    session_date:     record.date,
    started_at:       record.startedAt,
    duration_seconds: record.durationSeconds,
  });
}

function syncAchievementUnlock(userId: string, id: string, unlockedAt: string) {
  void supabase.from('user_achievements').upsert(
    { user_id: userId, achievement_id: id, unlocked_at: unlockedAt },
    { onConflict: 'user_id,achievement_id' },
  );
}

// =========================================================
// Store
// =========================================================

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

      userId: null,
      isSyncing: false,

      // ── selectCharacter ──────────────────────────
      selectCharacter: (char, nick) => {
        set({ selectedCharacter: char, nickname: nick, hasChosenCharacter: true });
        const { userId } = get();
        if (userId) syncProfile(userId, get());
      },

      // ── addCoins ────────────────────────────────
      addCoins: (amount) => {
        set((s) => ({ coins: Math.max(0, s.coins + amount) }));
        const { userId } = get();
        if (userId) syncProfile(userId, get());
      },

      // ── addInventoryItem ─────────────────────────
      addInventoryItem: (def) => {
        set((s) => ({
          inventory: [
            ...s.inventory,
            { instanceId: makeInstanceId(), definitionId: def.id },
          ],
        }));
        const { userId, inventory } = get();
        if (userId) syncInventoryFull(userId, inventory);
      },

      // ── equipItem ───────────────────────────────
      equipItem: (type, definitionId) => {
        set((s) => ({ equipped: { ...s.equipped, [type]: definitionId } }));
        const { userId } = get();
        if (userId) syncProfile(userId, get());
      },

      // ── unequipItem ──────────────────────────────
      unequipItem: (type) => {
        set((s) => ({ equipped: { ...s.equipped, [type]: null } }));
        const { userId } = get();
        if (userId) syncProfile(userId, get());
      },

      // ── addSessionRecord ─────────────────────────
      addSessionRecord: (record) => {
        const fullRecord: SessionRecord = { ...record, date: todayISO() };
        set((s) => ({
          sessionHistory: [...s.sessionHistory, fullRecord],
        }));
        const { userId } = get();
        if (userId) syncSessionAppend(userId, fullRecord);
      },

      // ── unlockAchievement ────────────────────────
      unlockAchievement: (id) => {
        const { achievements } = get();
        const existing = achievements.find((a) => a.id === id);
        if (!existing || existing.unlockedAt !== null) return; // already unlocked

        const unlockedAt = new Date().toISOString();
        set((s) => ({
          achievements: s.achievements.map((a) =>
            a.id === id ? { ...a, unlockedAt } : a
          ),
        }));
        const { userId } = get();
        if (userId) syncAchievementUnlock(userId, id, unlockedAt);
      },

      // ── setPendingReward ─────────────────────────
      setPendingReward: (item) => set({ pendingReward: item }),

      // ── claimReward ──────────────────────────────
      claimReward: () => {
        const { pendingReward } = get();
        if (!pendingReward) return;
        get().addInventoryItem(pendingReward);  // sync handled inside addInventoryItem
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
        const { userId, inventory } = get();
        if (userId) syncInventoryFull(userId, inventory);
      },

      // ── loadFromCloud ────────────────────────────
      loadFromCloud: async (userId) => {
        set({ userId, isSyncing: true });

        // Fetch profile
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (!profile) {
          // First login — upload current local state to cloud
          const s = get();
          await supabase.from('user_profiles').insert({
            user_id:              userId,
            nickname:             s.nickname,
            selected_character:   s.selectedCharacter,
            has_chosen_character: s.hasChosenCharacter,
            coins:                s.coins,
            equipped_background:  s.equipped.background,
            equipped_accessory:   s.equipped.accessory,
            equipped_skin:        s.equipped.skin,
          });

          // Upload inventory
          if (s.inventory.length > 0) {
            await supabase.from('user_inventory').insert(
              s.inventory.map((i) => ({
                user_id:       userId,
                instance_id:   i.instanceId,
                definition_id: i.definitionId,
              })),
            );
          }

          // Upload sessions
          if (s.sessionHistory.length > 0) {
            await supabase.from('user_sessions').insert(
              s.sessionHistory.map((r) => ({
                user_id:          userId,
                session_date:     r.date,
                started_at:       r.startedAt,
                duration_seconds: r.durationSeconds,
              })),
            );
          }

          // Upload achievements
          const achRows = s.achievements
            .filter((a) => a.unlockedAt !== null)
            .map((a) => ({
              user_id:        userId,
              achievement_id: a.id,
              unlocked_at:    a.unlockedAt,
            }));
          if (achRows.length > 0) {
            await supabase
              .from('user_achievements')
              .upsert(achRows, { onConflict: 'user_id,achievement_id' });
          }

          set({ userId, isSyncing: false });
          return;
        }

        // Existing user — load cloud data in parallel
        const [invResult, sessResult, achResult] = await Promise.all([
          supabase
            .from('user_inventory')
            .select('instance_id, definition_id')
            .eq('user_id', userId),
          supabase
            .from('user_sessions')
            .select('session_date, started_at, duration_seconds')
            .eq('user_id', userId)
            .order('started_at', { ascending: true }),
          supabase
            .from('user_achievements')
            .select('achievement_id, unlocked_at')
            .eq('user_id', userId),
        ]);

        set({
          userId,
          isSyncing: false,
          nickname:           profile.nickname,
          selectedCharacter:  profile.selected_character as CharacterType,
          hasChosenCharacter: profile.has_chosen_character,
          coins:              profile.coins,
          equipped: {
            background: profile.equipped_background ?? null,
            accessory:  profile.equipped_accessory  ?? null,
            skin:       profile.equipped_skin        ?? null,
          },
          inventory: (invResult.data ?? []).map((r) => ({
            instanceId:   r.instance_id,
            definitionId: r.definition_id,
          })),
          sessionHistory: (sessResult.data ?? []).map((r) => ({
            date:            r.session_date,
            startedAt:       r.started_at,
            durationSeconds: r.duration_seconds,
          })),
          achievements: ACHIEVEMENTS.map((a) => {
            const cloud = (achResult.data ?? []).find(
              (r) => r.achievement_id === a.id,
            );
            return { id: a.id, unlockedAt: cloud?.unlocked_at ?? null };
          }),
        });
      },

      // ── clearUserId ──────────────────────────────
      clearUserId: () => set({ userId: null }),
    }),
    {
      name: 'cute-pomodoro-v2',
      // Don't persist pendingReward or userId
      partialize: (state) => ({
        selectedCharacter:  state.selectedCharacter,
        nickname:           state.nickname,
        hasChosenCharacter: state.hasChosenCharacter,
        coins:              state.coins,
        inventory:          state.inventory,
        equipped:           state.equipped,
        sessionHistory:     state.sessionHistory,
        achievements:       state.achievements,
      }),
    }
  )
);
