import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../features/auth/useAuthStore';
import { useGameStore } from '../../features/game/useGameStore';
import { playClick } from '../../utils/audio';

type AuthTab = '로그인' | '회원가입';
type SignupStep = 'form' | 'choice';

interface AuthPageProps {
  onGuest: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onGuest }) => {
  const { signIn, signUp, error, clearError, status } = useAuthStore();
  const isLoading = status === 'loading';

  const [tab,        setTab]        = useState<AuthTab>('로그인');
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [signupStep, setSignupStep] = useState<SignupStep>('form');

  const hasGuestProgress = useGameStore((s) => s.hasChosenCharacter);
  const resetForNewAccount = useGameStore((s) => s.resetForNewAccount);
  const selectedCharacter  = useGameStore((s) => s.selectedCharacter);
  const nickname           = useGameStore((s) => s.nickname);

  const handleTabSwitch = (t: AuthTab) => {
    playClick();
    clearError();
    setEmail('');
    setPassword('');
    setSignupStep('form');
    setTab(t);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (tab === '로그인') {
      await signIn(email.trim(), password, () => {});
      return;
    }

    // Sign-up: if guest has local progress, show choice first
    if (hasGuestProgress && signupStep === 'form') {
      setSignupStep('choice');
      return;
    }

    await signUp(email.trim(), password, () => {});
  };

  const handleKeepProgress = async () => {
    playClick();
    clearError();
    // Sign up; loadFromCloud will upload local state on first login
    await signUp(email.trim(), password, () => {});
  };

  const handleStartFresh = async () => {
    playClick();
    clearError();
    resetForNewAccount();
    await signUp(email.trim(), password, () => {});
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--cream)',
        padding: '24px 16px',
      }}
    >
      {/* Branding */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ textAlign: 'center', marginBottom: 36 }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 16 }}>
          <motion.img
            src="/characters/cat.png"
            alt="cat"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: 72, height: 72, objectFit: 'contain' }}
          />
          <motion.img
            src="/characters/fox.png"
            alt="fox"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
            style={{ width: 72, height: 72, objectFit: 'contain' }}
          />
        </div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--rose)', margin: 0, lineHeight: 1 }}>
          Cute Pomodoro
        </h1>
        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: 8 }}>
          귀여운 친구들과 함께 집중해요 🍅
        </p>
      </motion.div>

      {/* Auth card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="glass-card"
        style={{ width: '100%', maxWidth: 360, padding: '28px 28px 24px' }}
      >
        <AnimatePresence mode="wait">
          {/* ── Choice step ──────────────────────────────── */}
          {signupStep === 'choice' ? (
            <motion.div
              key="choice"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.22 }}
            >
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: '2rem', marginBottom: 10 }}>
                  {selectedCharacter === 'cat' ? '🐱' : '🦊'}
                </div>
                <h2 style={{ fontWeight: 900, fontSize: '1.05rem', color: 'var(--text-primary)', margin: '0 0 8px' }}>
                  기존 진행사항이 있어요!
                </h2>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
                  게스트로 플레이한 <strong style={{ color: 'var(--text-secondary)' }}>{nickname}</strong> 의<br />
                  데이터를 어떻게 할까요?
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <motion.button
                  className="btn btn-primary"
                  onClick={() => void handleKeepProgress()}
                  disabled={isLoading}
                  whileHover={!isLoading ? { scale: 1.02, y: -2 } : {}}
                  whileTap={!isLoading ? { scale: 0.97 } : {}}
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '0.92rem',
                    opacity: isLoading ? 0.6 : 1,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isLoading ? '처리 중...' : '✨ 현재 진행사항으로 가입'}
                </motion.button>

                <motion.button
                  className="btn btn-ghost"
                  onClick={() => void handleStartFresh()}
                  disabled={isLoading}
                  whileHover={!isLoading ? { scale: 1.02 } : {}}
                  whileTap={!isLoading ? { scale: 0.97 } : {}}
                  style={{
                    width: '100%',
                    padding: '13px',
                    fontSize: '0.88rem',
                    opacity: isLoading ? 0.6 : 1,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  🌱 캐릭터 새로 만들기
                </motion.button>

                <button
                  onClick={() => { playClick(); setSignupStep('form'); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    padding: '6px 0',
                    textAlign: 'center',
                  }}
                >
                  ← 돌아가기
                </button>
              </div>

              {/* Error banner */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{
                      marginTop: 12,
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: '#E8526F',
                      background: 'rgba(255, 107, 138, 0.08)',
                      border: '1.5px solid rgba(255, 107, 138, 0.25)',
                      borderRadius: 'var(--radius-md)',
                      padding: '8px 12px',
                      overflow: 'hidden',
                    }}
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            /* ── Form step ──────────────────────────────── */
            <motion.div
              key="form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.22 }}
            >
              {/* Tab switcher */}
              <div
                style={{
                  display: 'flex',
                  gap: 4,
                  padding: 4,
                  background: 'rgba(255,255,255,0.6)',
                  borderRadius: 'var(--radius-full)',
                  border: '1.5px solid rgba(255,255,255,0.85)',
                  marginBottom: 22,
                }}
              >
                {(['로그인', '회원가입'] as AuthTab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => handleTabSwitch(t)}
                    style={{
                      flex: 1,
                      padding: '9px 0',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.88rem',
                      fontWeight: 800,
                      border: 'none',
                      cursor: 'pointer',
                      background: tab === t ? '#fff' : 'transparent',
                      color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
                      boxShadow: tab === t ? 'var(--shadow-xs)' : 'none',
                      transition: 'all 0.2s',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Form */}
              <form onSubmit={(e) => void handleSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 5 }}>
                    이메일
                  </label>
                  <input
                    className="input-field"
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    autoFocus
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 5 }}>
                    비밀번호
                  </label>
                  <input
                    className="input-field"
                    type="password"
                    placeholder={tab === '회원가입' ? '6자리 이상 입력' : '비밀번호 입력'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete={tab === '로그인' ? 'current-password' : 'new-password'}
                    minLength={6}
                  />
                </div>

                {/* Error banner */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: '#E8526F',
                        background: 'rgba(255, 107, 138, 0.08)',
                        border: '1.5px solid rgba(255, 107, 138, 0.25)',
                        borderRadius: 'var(--radius-md)',
                        padding: '8px 12px',
                        overflow: 'hidden',
                      }}
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading || !email || !password}
                  whileHover={!isLoading ? { scale: 1.02, y: -2 } : {}}
                  whileTap={!isLoading ? { scale: 0.97 } : {}}
                  style={{
                    width: '100%',
                    padding: '14px',
                    marginTop: 2,
                    fontSize: '0.95rem',
                    opacity: (isLoading || !email || !password) ? 0.6 : 1,
                    cursor: (isLoading || !email || !password) ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isLoading
                    ? '처리 중...'
                    : tab === '로그인' ? '로그인' : '회원가입'}
                </motion.button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Guest mode */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        style={{ marginTop: 20, textAlign: 'center' }}
      >
        <button
          onClick={() => { playClick(); onGuest(); }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.82rem',
            fontWeight: 700,
            color: 'var(--text-muted)',
            padding: '8px 16px',
            borderRadius: 'var(--radius-full)',
            transition: 'color 0.2s',
            textDecoration: 'underline',
            textUnderlineOffset: 3,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          로그인 없이 게스트로 시작하기 →
        </button>
      </motion.div>
    </div>
  );
};
