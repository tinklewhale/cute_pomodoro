import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAuthStore } from '../../features/auth/useAuthStore';
import { playClick } from '../../utils/audio';

type AuthTab = '로그인' | '회원가입';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (userId: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess }) => {
  const { signIn, signUp, error, clearError, status } = useAuthStore();
  const isLoading = status === 'loading';

  const [tab,      setTab]      = useState<AuthTab>('로그인');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');

  const handleTabSwitch = (t: AuthTab) => {
    playClick();
    clearError();
    setEmail('');
    setPassword('');
    setTab(t);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    const cb = (userId: string) => {
      onSuccess(userId);
      onClose();
    };

    if (tab === '로그인') {
      await signIn(email.trim(), password, cb);
    } else {
      await signUp(email.trim(), password, cb);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(61, 44, 44, 0.35)',
          backdropFilter: 'blur(4px)',
          zIndex: 50,
        }}
      />

      {/* Centering wrapper — separate from motion.div so transforms don't conflict */}
      <div
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 51,
          width: 'min(360px, 92vw)',
        }}
      >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 8 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        style={{
          background: 'var(--cream)',
          border: '2px solid rgba(255,255,255,0.9)',
          borderRadius: 'var(--radius-xl)',
          padding: '28px 28px 24px',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--text-primary)', margin: 0 }}>
            ☁️ 클라우드 저장
          </h2>
          <motion.button
            className="btn btn-ghost btn-icon"
            onClick={onClose}
            style={{ width: 34, height: 34 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.93 }}
          >
            <X size={16} />
          </motion.button>
        </div>

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
                padding: '8px 0',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.85rem',
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
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 800,
                color: 'var(--text-secondary)',
                marginBottom: 5,
              }}
            >
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
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 800,
                color: 'var(--text-secondary)',
                marginBottom: 5,
              }}
            >
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
              padding: '13px',
              marginTop: 4,
              fontSize: '0.95rem',
              opacity: (isLoading || !email || !password) ? 0.6 : 1,
              cursor: (isLoading || !email || !password) ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading
              ? '처리 중...'
              : tab === '로그인' ? '로그인' : '회원가입'
            }
          </motion.button>
        </form>

        <p
          style={{
            fontSize: '0.72rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            textAlign: 'center',
            marginTop: 16,
            marginBottom: 0,
            lineHeight: 1.6,
          }}
        >
          로그인하지 않아도 이 기기에서 플레이할 수 있어요.<br />
          로그인하면 어디서든 데이터를 이어받아요. 🌐
        </p>
      </motion.div>
      </div>
    </>
  );
};
