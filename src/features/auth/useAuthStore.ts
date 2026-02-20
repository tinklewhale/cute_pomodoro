import { create } from 'zustand';
import type { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

// ── Types ───────────────────────────────────────────────────

export type AuthStatus = 'loading' | 'authenticated' | 'guest';

interface AuthState {
  user:   User | null;
  status: AuthStatus;
  error:  string | null;

  /**
   * Call once on app mount. Subscribes to onAuthStateChange.
   * Calls onLoginCallback(userId) when a session is found.
   * Returns unsubscribe cleanup for useEffect.
   */
  init: (onLoginCallback: (userId: string) => void) => () => void;

  signIn: (
    email: string,
    password: string,
    onLoginCallback: (userId: string) => void,
  ) => Promise<void>;

  signUp: (
    email: string,
    password: string,
    onLoginCallback: (userId: string) => void,
  ) => Promise<void>;

  signOut: () => Promise<void>;
  clearError: () => void;
}

// ── Store ───────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()((set) => ({
  user:   null,
  status: 'loading',
  error:  null,

  // ── init ──────────────────────────────────────────────────
  init: (onLoginCallback) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: any, session: any) => {
        if (session?.user) {
          set({ user: session.user, status: 'authenticated', error: null });
          onLoginCallback(session.user.id);
        } else {
          set({ user: null, status: 'guest', error: null });
        }
      },
    );
    return () => subscription.unsubscribe();
  },

  // ── signIn ────────────────────────────────────────────────
  signIn: async (email, password, onLoginCallback) => {
    set({ error: null, status: 'loading' });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.session) {
      set({ status: 'guest', error: mapAuthError(error) });
      return;
    }

    set({ user: data.session.user, status: 'authenticated', error: null });
    // onAuthStateChange also fires, but calling directly avoids a frame delay
    onLoginCallback(data.session.user.id);
  },

  // ── signUp ────────────────────────────────────────────────
  signUp: async (email, password, onLoginCallback) => {
    set({ error: null, status: 'loading' });
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      set({ status: 'guest', error: mapAuthError(error) });
      return;
    }

    if (!data.session) {
      // Email confirmation is required — tell user to check inbox
      set({
        status: 'guest',
        error: '가입 확인 이메일을 발송했어요. 메일을 확인해주세요.',
      });
      return;
    }

    set({ user: data.session.user, status: 'authenticated', error: null });
    onLoginCallback(data.session.user.id);
  },

  // ── signOut ───────────────────────────────────────────────
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, status: 'guest', error: null });
  },

  clearError: () => set({ error: null }),
}));

// ── Error message mapper ────────────────────────────────────

function mapAuthError(error: AuthError | null): string {
  if (!error) return '알 수 없는 오류가 발생했어요.';
  const msg = error.message.toLowerCase();

  if (msg.includes('invalid login credentials') || msg.includes('invalid email or password')) {
    return '이메일 또는 비밀번호가 올바르지 않아요.';
  }
  if (msg.includes('email already registered') || msg.includes('user already registered')) {
    return '이미 가입된 이메일이에요. 로그인을 시도해보세요.';
  }
  if (msg.includes('password should be at least') || msg.includes('weak password')) {
    return '비밀번호는 최소 6자리여야 해요.';
  }
  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return '요청이 너무 많아요. 잠시 후 다시 시도해주세요.';
  }
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch')) {
    return '네트워크 오류가 발생했어요. 인터넷 연결을 확인해주세요.';
  }
  if (msg.includes('email not confirmed')) {
    return '이메일 인증을 완료해주세요.';
  }
  return `오류: ${error.message}`;
}
