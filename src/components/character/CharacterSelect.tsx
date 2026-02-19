import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../features/game/useGameStore';
import type { CharacterType } from '../../data/items';
import { playClick } from '../../utils/audio';

const CHARACTERS: { id: CharacterType; nameKo: string; descKo: string; emoji: string }[] = [
  {
    id: 'cat',
    nameKo: '고양이',
    descKo: '귀엽고 아늑한 고양이예요. 포근한 성격으로 집중을 도와줄게요!',
    emoji: '🐱',
  },
  {
    id: 'fox',
    nameKo: '여우',
    descKo: '영리하고 씩씩한 여우예요. 함께라면 어떤 공부도 거뜬해요!',
    emoji: '🦊',
  },
];

export const CharacterSelect: React.FC = () => {
  const { selectCharacter } = useGameStore();
  const [selected, setSelected] = useState<CharacterType | null>(null);
  const [nickname, setNickname] = useState('');
  const [step, setStep] = useState<'pick' | 'nickname'>('pick');

  const handleSelectChar = (id: CharacterType) => {
    playClick();
    setSelected(id);
  };

  const handleNext = () => {
    if (!selected) return;
    playClick();
    setStep('nickname');
  };

  const handleConfirm = () => {
    if (!selected || nickname.trim().length < 1) return;
    playClick();
    selectCharacter(selected, nickname.trim());
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'var(--cream)',
      }}
    >
      {/* Background decorations */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute', top: '-10%', right: '-5%',
          width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(196,168,232,0.25) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', left: '-5%',
          width: 350, height: 350,
          background: 'radial-gradient(circle, rgba(126,219,183,0.22) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: '100%',
          maxWidth: 540,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{ fontSize: '3.5rem', marginBottom: 12 }}
          >
            🍅
          </motion.div>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 900,
            color: 'var(--rose)',
            marginBottom: 6,
          }}>
            Cute Pomodoro
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '1rem' }}>
            함께할 친구를 선택해주세요!
          </p>
        </div>

        {step === 'pick' ? (
          <>
            {/* Character cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              {CHARACTERS.map((char) => {
                const isSelected = selected === char.id;
                return (
                  <motion.button
                    key={char.id}
                    onClick={() => handleSelectChar(char.id)}
                    whileHover={{ scale: 1.03, y: -4 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    style={{
                      background: isSelected
                        ? 'rgba(255, 107, 138, 0.08)'
                        : 'rgba(255, 255, 255, 0.7)',
                      border: isSelected
                        ? '2.5px solid var(--rose)'
                        : '2.5px solid rgba(255, 255, 255, 0.9)',
                      borderRadius: 'var(--radius-xl)',
                      padding: '20px 16px',
                      cursor: 'pointer',
                      backdropFilter: 'blur(12px)',
                      boxShadow: isSelected
                        ? '0 8px 32px rgba(255, 107, 138, 0.22)'
                        : 'var(--shadow-sm)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 12,
                      position: 'relative',
                      transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
                    }}
                  >
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        style={{
                          position: 'absolute',
                          top: 10, right: 10,
                          width: 24, height: 24,
                          borderRadius: '50%',
                          background: 'var(--rose)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                        }}
                      >
                        ✓
                      </motion.div>
                    )}

                    {/* Character image */}
                    <div style={{
                      width: 120,
                      height: 120,
                      borderRadius: 'var(--radius-lg)',
                      overflow: 'hidden',
                      background: 'var(--cream-dark)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <img
                        src={`/characters/${char.id}.png`}
                        alt={char.nameKo}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                        {char.emoji} {char.nameKo}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, lineHeight: 1.4 }}>
                        {char.descKo}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <motion.button
              onClick={handleNext}
              disabled={!selected}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '1rem',
                opacity: selected ? 1 : 0.4,
                background: 'var(--rose-grad)',
                color: '#fff',
                borderRadius: 'var(--radius-full)',
                fontWeight: 800,
                border: 'none',
                cursor: selected ? 'pointer' : 'not-allowed',
                boxShadow: selected ? 'var(--shadow-rose)' : 'none',
                transition: 'opacity 0.2s, box-shadow 0.2s',
              }}
              whileHover={selected ? { scale: 1.02, y: -2 } : {}}
              whileTap={selected ? { scale: 0.98 } : {}}
            >
              다음 →
            </motion.button>
          </>
        ) : (
          /* Nickname step */
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Selected character preview */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginBottom: 28,
            }}>
              <div style={{
                width: 140,
                height: 140,
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
                background: 'var(--cream-dark)',
                border: '3px solid rgba(255, 107, 138, 0.3)',
                boxShadow: '0 8px 32px rgba(255, 107, 138, 0.18)',
                marginBottom: 12,
              }}>
                <img
                  src={`/characters/${selected}.png`}
                  alt={selected ?? ''}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
              <p style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.9rem' }}>
                닉네임을 정해줄게요!
              </p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <input
                className="input-field"
                type="text"
                placeholder="ex) 열공하는 고양이"
                maxLength={12}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                autoFocus
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: 6, textAlign: 'right' }}>
                {nickname.length}/12
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn btn-ghost"
                style={{ flex: 1 }}
                onClick={() => { playClick(); setStep('pick'); }}
              >
                ← 뒤로
              </button>
              <motion.button
                style={{
                  flex: 2,
                  padding: '14px',
                  fontSize: '1rem',
                  opacity: nickname.trim().length >= 1 ? 1 : 0.4,
                  background: 'var(--rose-grad)',
                  color: '#fff',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 800,
                  border: 'none',
                  cursor: nickname.trim().length >= 1 ? 'pointer' : 'not-allowed',
                  boxShadow: nickname.trim().length >= 1 ? 'var(--shadow-rose)' : 'none',
                }}
                onClick={handleConfirm}
                whileHover={nickname.trim().length >= 1 ? { scale: 1.02, y: -2 } : {}}
                whileTap={nickname.trim().length >= 1 ? { scale: 0.97 } : {}}
              >
                시작하기 🎉
              </motion.button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
