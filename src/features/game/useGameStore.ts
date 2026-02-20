import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { ItemDefinition, CharacterType } from '../../data/items';
import { ACHIEVEMENTS } from '../../data/items';
import { supabase } from '../../lib/supabase';

// ── Session token (concurrent login detection) ────────────
const SESSION_TOKEN_KEY = 'cute-pomodoro-session-token';
let profileChannel: RealtimeChannel | null = null;
let sessionInitialized = false;

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

  equipCharacter: (char: CharacterType) => void;

  // Concurrent session state
  sessionConflict: boolean;

  // Cloud sync actions
  loadFromCloud: (userId: string) => Promise<void>;
  clearUserId: () => void;
  resetForNewAccount: () => void;
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

async function syncProfile(userId: string, s: GameState): Promise<void> {
  const { error } = await supabase.from('user_profiles').upsert(
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
  if (error) console.error('[sync] profile upsert failed:', error);
}

async function syncInventoryFull(userId: string, inventory: InventoryItem[]): Promise<void> {
  // Delete all rows then re-insert (simpler than diffing for small sets)
  const { error: delErr } = await supabase
    .from('user_inventory')
    .delete()
    .eq('user_id', userId);
  if (delErr) {
    console.error('[sync] inventory delete failed:', delErr);
    return;
  }
  if (inventory.length === 0) return;
  const { error: insErr } = await supabase.from('user_inventory').insert(
    inventory.map((i) => ({
      user_id:       userId,
      instance_id:   i.instanceId,
      definition_id: i.definitionId,
    })),
  );
  if (insErr) console.error('[sync] inventory insert failed:', insErr);
}

async function syncSessionAppend(userId: string, record: SessionRecord): Promise<void> {
  const { error } = await supabase.from('user_sessions').insert({
    user_id:          userId,
    session_date:     record.date,
    started_at:       record.startedAt,
    duration_seconds: record.durationSeconds,
  });
  if (error) console.error('[sync] session append failed:', error);
}

async function syncAchievementUnlock(userId: string, id: string, unlockedAt: string): Promise<void> {
  const { error } = await supabase.from('user_achievements').upsert(
    { user_id: userId, achievement_id: id, unlocked_at: unlockedAt },
    { onConflict: 'user_id,achievement_id' },
  );
  if (error) console.error('[sync] achievement unlock failed:', error);
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
      sessionConflict: false,

      // ── selectCharacter ──────────────────────────
      selectCharacter: (char, nick) => {
        const charItemId = char === 'cat' ? 'char_cat' : 'char_fox';
        const hasCharItem = get().inventory.some((i) => i.definitionId === charItemId);
        const newInventory = hasCharItem
          ? get().inventory
          : [...get().inventory, { instanceId: makeInstanceId(), definitionId: charItemId }];
        set({ selectedCharacter: char, nickname: nick, hasChosenCharacter: true, inventory: newInventory });
        const { userId } = get();
        if (userId) {
          syncProfile(userId, get());
          syncInventoryFull(userId, get().inventory);
        }
      },

      // ── equipCharacter ───────────────────────────
      equipCharacter: (char) => {
        set({ selectedCharacter: char });
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

        // 조회 에러 발생 시 로컬 데이터를 보존하고 userId만 세팅
        if (invResult.error || sessResult.error || achResult.error) {
          console.error(
            '[loadFromCloud] fetch error:',
            invResult.error, sessResult.error, achResult.error,
          );
          set({ userId, isSyncing: false });
          return;
        }

        // ── Equipped fallback ─────────────────────────
        const localEquipped = get().equipped;
        const cloudEquipped = {
          background: profile.equipped_background ?? null,
          accessory:  profile.equipped_accessory  ?? null,
          skin:       profile.equipped_skin        ?? null,
        };
        const hasLocalEquipped = Object.values(localEquipped).some(v => v !== null);
        const hasCloudEquipped = Object.values(cloudEquipped).some(v => v !== null);
        // 클라우드가 모두 null이고 로컬에 장착 아이템이 있으면 로컬 보존 (sync 실패 대비)
        const equippedToSet = (!hasCloudEquipped && hasLocalEquipped) ? localEquipped : cloudEquipped;
        if (!hasCloudEquipped && hasLocalEquipped) {
          console.warn('[loadFromCloud] cloud equipped empty — keeping local equipped (possible sync failure)');
        }

        set({
          userId,
          isSyncing: false,
          nickname:           profile.nickname,
          selectedCharacter:  profile.selected_character as CharacterType,
          hasChosenCharacter: profile.has_chosen_character,
          coins:              profile.coins,
          equipped: equippedToSet,
          inventory: (() => {
            const cloudInv = (invResult.data ?? []).map((r) => ({
              instanceId:   r.instance_id,
              definitionId: r.definition_id,
            }));
            const localInv = get().inventory;
            // 클라우드가 비었는데 로컬에 아이템이 있으면 sync가 실패한 것으로 간주해 로컬 보존
            if (cloudInv.length === 0 && localInv.length > 0) {
              console.warn('[loadFromCloud] cloud inventory empty — keeping local inventory (possible sync failure)');
              return localInv;
            }
            return cloudInv;
          })(),
          sessionHistory: (sessResult.data ?? []).map((r) => ({
            date:            r.session_date,
            startedAt:       r.started_at,
            durationSeconds: r.duration_seconds,
          })),
          achievements: ACHIEVEMENTS.map((a) => {
            const cloud = (achResult.data ?? []).find(
              (r) => r.achievement_id === a.id,
            );
            const local = get().achievements.find((l) => l.id === a.id);
            // 클라우드·로컬 중 unlockedAt이 있는 쪽 우선 (업적은 다시 잠기지 않으므로 안전)
            return { id: a.id, unlockedAt: cloud?.unlocked_at ?? local?.unlockedAt ?? null };
          }),
        });

        // 로컬 equipped 보존 시 클라우드에도 즉시 업로드
        if (!hasCloudEquipped && hasLocalEquipped) {
          void syncProfile(userId, get());
        }

        // ── Session token (동시 로그인 감지) ─────────────
        // 페이지 로드당 1회만 실행 (TOKEN_REFRESHED 이벤트 중복 방지)
        if (!sessionInitialized) {
          sessionInitialized = true;
          const token = crypto.randomUUID();
          localStorage.setItem(SESSION_TOKEN_KEY, token);

          // Realtime Broadcast: DB 변경 없이 WebSocket으로 동시 로그인 감지
          // postgres_changes + RLS 문제 없이 동작
          const ch = supabase
            .channel(`user-logins:${userId}`)
            .on('broadcast', { event: 'new-session' }, ({ payload }) => {
              const incomingToken = payload?.token as string | undefined;
              const myToken = localStorage.getItem(SESSION_TOKEN_KEY);
              if (incomingToken && myToken && incomingToken !== myToken) {
                // 다른 기기에서 같은 계정으로 로그인됨
                set({ sessionConflict: true });
              }
            })
            .subscribe(async (status) => {
              if (status === 'SUBSCRIBED') {
                // 구독 완료 후 현재 기기 토큰 브로드캐스트 → 기존 기기에서 충돌 감지
                await ch.send({
                  type: 'broadcast',
                  event: 'new-session',
                  payload: { token },
                });
              }
            });

          profileChannel = ch;
        }
      },

      // ── clearUserId ──────────────────────────────
      clearUserId: () => {
        if (profileChannel) {
          void supabase.removeChannel(profileChannel);
          profileChannel = null;
        }
        sessionInitialized = false;
        localStorage.removeItem(SESSION_TOKEN_KEY);
        set({ userId: null, sessionConflict: false });
      },

      // ── resetForNewAccount ───────────────────────
      resetForNewAccount: () => set({
        selectedCharacter: 'cat',
        nickname: '',
        hasChosenCharacter: false,
        coins: 0,
        inventory: [],
        equipped: { background: null, accessory: null, skin: null },
        sessionHistory: [],
        achievements: initialAchievements,
        pendingReward: null,
      }),
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
