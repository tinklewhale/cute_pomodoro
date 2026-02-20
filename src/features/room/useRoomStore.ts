import { create, type StoreApi } from 'zustand';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import type { CharacterType } from '../../data/items';

// =========================================================
// Types
// =========================================================

export type MemberTimerStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface RoomMember {
  userId: string;
  nickname: string;
  characterId: CharacterType;
  timerStatus: MemberTimerStatus;
  focusSecondsToday: number;
  timerSecondsLeft: number;   // 남은 타이머 (Broadcast로 동기화, DB 컬럼 없음)
  timerUpdatedAt: number;     // 마지막 업데이트 timestamp (클라이언트 보간용)
}

interface RoomState {
  roomId: string | null;
  roomCode: string | null;
  members: RoomMember[];
  isConnected: boolean;
  error: string | null;
  channel: RealtimeChannel | null;

  // Actions
  createRoom: (userId: string, nickname: string, characterId: CharacterType, timerStatus?: MemberTimerStatus, focusSecondsToday?: number) => Promise<void>;
  joinRoom: (code: string, userId: string, nickname: string, characterId: CharacterType, timerStatus?: MemberTimerStatus, focusSecondsToday?: number) => Promise<void>;
  leaveRoom: (userId: string) => Promise<void>;
  broadcastTimerStatus: (userId: string, status: MemberTimerStatus) => Promise<void>;
  broadcastFocusSeconds: (userId: string, seconds: number) => Promise<void>;
  broadcastTimerTick: (userId: string, seconds: number) => Promise<void>;
  clearError: () => void;
}

// =========================================================
// Helpers
// =========================================================

function generateCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

const MAX_MEMBERS = 10;

// =========================================================
// Internal helper (not part of store interface)
// =========================================================

type SetFn = StoreApi<RoomState>['setState'];

async function subscribeRoom(roomId: string, code: string, set: SetFn) {
  const toMember = (row: Record<string, unknown>): RoomMember => ({
    userId:             row.user_id as string,
    nickname:           row.nickname as string,
    characterId:        row.character_id as CharacterType,
    timerStatus:        (row.timer_status as MemberTimerStatus) ?? 'idle',
    focusSecondsToday:  (row.focus_seconds_today as number) ?? 0,
    timerSecondsLeft:   0,
    timerUpdatedAt:     Date.now(),
  });

  const { data: initialMembers } = await supabase
    .from('room_members')
    .select('user_id, nickname, character_id, timer_status, focus_seconds_today')
    .eq('room_id', roomId);

  const members: RoomMember[] = (initialMembers ?? []).map(toMember);

  const channel = supabase
    .channel(`room:${roomId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'room_members', filter: `room_id=eq.${roomId}` },
      (payload) => {
        const { eventType, new: newRow, old: oldRow } = payload;
        set((s) => {
          if (eventType === 'INSERT') {
            return { members: [...s.members, toMember(newRow as Record<string, unknown>)] };
          }
          if (eventType === 'UPDATE') {
            // DB 업데이트는 timerSecondsLeft·timerUpdatedAt을 보존 (Broadcast로 관리)
            const updated = toMember(newRow as Record<string, unknown>);
            return {
              members: s.members.map((m) => m.userId === updated.userId
                ? { ...updated, timerSecondsLeft: m.timerSecondsLeft, timerUpdatedAt: m.timerUpdatedAt }
                : m
              ),
            };
          }
          if (eventType === 'DELETE') {
            const deletedId = (oldRow as Record<string, unknown>)?.user_id as string;
            return { members: s.members.filter((m) => m.userId !== deletedId) };
          }
          return {};
        });
      }
    )
    .on('broadcast', { event: 'timer-tick' }, ({ payload }) => {
      // 상대방 타이머 남은 시간 수신 (DB 없이 Broadcast로만 동기화)
      const { userId, seconds } = payload as { userId: string; seconds: number };
      set((s) => ({
        members: s.members.map((m) =>
          m.userId === userId
            ? { ...m, timerSecondsLeft: seconds, timerUpdatedAt: Date.now() }
            : m
        ),
      }));
    })
    .subscribe();

  set({ roomId, roomCode: code, members, isConnected: true, channel, error: null });
}

// =========================================================
// Store
// =========================================================

export const useRoomStore = create<RoomState>((set, get) => ({
  roomId:      null,
  roomCode:    null,
  members:     [],
  isConnected: false,
  error:       null,
  channel:     null,

  clearError: () => set({ error: null }),

  // ── createRoom ──────────────────────────────────
  createRoom: async (userId, nickname, characterId, timerStatus = 'idle', focusSecondsToday = 0) => {
    const code = generateCode();
    const roomId = `room_${code}`;

    // Insert room
    const { error: roomErr } = await supabase
      .from('rooms')
      .insert({ id: roomId, host_user_id: userId });

    if (roomErr) {
      set({ error: '방 생성에 실패했어요. 다시 시도해주세요.' });
      return;
    }

    // Insert self as member
    const { error: memberErr } = await supabase
      .from('room_members')
      .insert({
        room_id:   roomId,
        user_id:   userId,
        nickname,
        character_id:        characterId,
        timer_status:        timerStatus,
        focus_seconds_today: focusSecondsToday,
      });

    if (memberErr) {
      set({ error: '방 참여에 실패했어요.' });
      return;
    }

    await subscribeRoom(roomId, code, set);
  },

  // ── joinRoom ────────────────────────────────────
  joinRoom: async (code, userId, nickname, characterId, timerStatus = 'idle', focusSecondsToday = 0) => {
    const roomId = `room_${code.toUpperCase()}`;

    // Check room exists
    const { data: room, error: roomErr } = await supabase
      .from('rooms')
      .select('id')
      .eq('id', roomId)
      .single();

    if (roomErr || !room) {
      set({ error: '방을 찾을 수 없어요. 코드를 확인해주세요.' });
      return;
    }

    // Check max members
    const { count } = await supabase
      .from('room_members')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomId);

    if ((count ?? 0) >= MAX_MEMBERS) {
      set({ error: '방이 꽉 찼어요 (최대 10명).' });
      return;
    }

    // Upsert member (in case rejoining)
    const { error: memberErr } = await supabase
      .from('room_members')
      .upsert({
        room_id:   roomId,
        user_id:   userId,
        nickname,
        character_id:        characterId,
        timer_status:        timerStatus,
        focus_seconds_today: focusSecondsToday,
      });

    if (memberErr) {
      set({ error: '방 참여에 실패했어요.' });
      return;
    }

    await subscribeRoom(roomId, code.toUpperCase(), set);
  },

  // ── leaveRoom ───────────────────────────────────
  leaveRoom: async (userId) => {
    const { roomId, channel } = get();
    if (!roomId) return;

    // Unsubscribe realtime
    if (channel) {
      await supabase.removeChannel(channel);
    }

    // Delete member row
    await supabase
      .from('room_members')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', userId);

    set({
      roomId:      null,
      roomCode:    null,
      members:     [],
      isConnected: false,
      channel:     null,
      error:       null,
    });
  },

  // ── broadcastTimerStatus ────────────────────────
  broadcastTimerStatus: async (userId, status) => {
    const { roomId } = get();
    if (!roomId) return;

    await supabase
      .from('room_members')
      .update({ timer_status: status })
      .eq('room_id', roomId)
      .eq('user_id', userId);
  },

  // ── broadcastFocusSeconds ───────────────────────
  broadcastFocusSeconds: async (userId, seconds) => {
    const { roomId } = get();
    if (!roomId) return;

    await supabase
      .from('room_members')
      .update({ focus_seconds_today: seconds })
      .eq('room_id', roomId)
      .eq('user_id', userId);
  },

  // ── broadcastTimerTick ──────────────────────────
  // DB 없이 Broadcast 채널로 타이머 남은 시간 전송
  broadcastTimerTick: async (userId, seconds) => {
    const { channel } = get();
    if (!channel) return;
    await channel.send({
      type: 'broadcast',
      event: 'timer-tick',
      payload: { userId, seconds },
    });
  },

}));
