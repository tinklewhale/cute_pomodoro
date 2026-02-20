import React from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Settings } from 'lucide-react';
import { useTimerStore, type TimerMode } from '../../features/timer/useTimerStore';
import { CharacterView } from '../character/CharacterView';
import { playClick } from '../../utils/audio';

// ── Helpers ────────────────────────────────────────────────
const pad = (n: number) => String(n).padStart(2, '0');
const formatTime = (s: number) => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;

const MODE_CONFIG = {
  focus: {
    labelKo:       '집중',
    statusRunning: '집중 중...',
    statusPaused:  '일시정지',
    statusIdle:    '준비',
    statusCompleted: '완료!',
    gradStart: '#FF6B8A',
    gradEnd:   '#E8526F',
    trackColor: 'rgba(255, 107, 138, 0.12)',
  },
  shortBreak: {
    labelKo:       '짧은 휴식',
    statusRunning: '휴식 중 ☕',
    statusPaused:  '일시정지',
    statusIdle:    '휴식 준비',
    statusCompleted: '휴식 완료!',
    gradStart: '#7EDBB7',
    gradEnd:   '#5EC49A',
    trackColor: 'rgba(126, 219, 183, 0.12)',
  },
  longBreak: {
    labelKo:       '긴 휴식',
    statusRunning: '충분히 쉬어요 🌿',
    statusPaused:  '일시정지',
    statusIdle:    '휴식 준비',
    statusCompleted: '휴식 완료!',
    gradStart: '#89C4F4',
    gradEnd:   '#5BA8E5',
    trackColor: 'rgba(137, 196, 244, 0.12)',
  },
};

const RADIUS = 110;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// ── Settings Panel ──────────────────────────────────────────
interface SettingsProps {
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsProps> = ({ onClose }) => {
  const { focusDuration, shortBreakDuration, longBreakDuration, setDurations } = useTimerStore();
  const [focus, setFocus]           = React.useState(Math.floor(focusDuration / 60));
  const [shortBrk, setShortBrk]    = React.useState(Math.floor(shortBreakDuration / 60));
  const [longBrk, setLongBrk]      = React.useState(Math.floor(longBreakDuration / 60));

  const handleSave = () => {
    setDurations(focus * 60, shortBrk * 60, longBrk * 60);
    onClose();
  };

  const numInput = (label: string, val: number, onChange: (v: number) => void, min = 1, max = 90) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
        {label}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button className="btn btn-ghost btn-icon" onClick={() => onChange(Math.max(min, val - 1))}>-</button>
        <input
          type="number"
          min={min}
          max={max}
          value={val}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            if (!isNaN(n)) onChange(Math.min(max, Math.max(min, n)));
          }}
          style={{
            fontWeight: 900,
            fontSize: '1.2rem',
            width: 56,
            textAlign: 'center',
            color: 'var(--text-primary)',
            border: '1.5px solid rgba(0,0,0,0.10)',
            borderRadius: 'var(--radius-sm)',
            padding: '4px 6px',
            background: 'rgba(255,255,255,0.8)',
            outline: 'none',
            MozAppearance: 'textfield',
          } as React.CSSProperties}
        />
        <button className="btn btn-ghost btn-icon" onClick={() => onChange(Math.min(max, val + 1))}>+</button>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>분</span>
      </div>
    </div>
  );

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
          background: 'rgba(61, 44, 44, 0.25)',
          backdropFilter: 'blur(3px)',
          zIndex: 200,
        }}
      />
      {/* Centering wrapper — separate from motion.div so transforms don't conflict */}
      <div
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 201,
          width: 'min(320px, 90vw)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 12 }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          style={{
            background: 'var(--cream)',
            border: '2px solid rgba(255,255,255,0.9)',
            borderRadius: 'var(--radius-xl)',
            padding: '24px 28px',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <h3 style={{ fontWeight: 900, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 16 }}>⏱️ 타이머 설정</h3>
          {numInput('집중 시간', focus, setFocus, 1, 90)}
          {numInput('짧은 휴식', shortBrk, setShortBrk, 1, 30)}
          {numInput('긴 휴식', longBrk, setLongBrk, 1, 60)}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button className="btn btn-ghost" style={{ flex: 1, padding: '8px' }} onClick={onClose}>취소</button>
            <button className="btn btn-primary" style={{ flex: 1, padding: '8px' }} onClick={handleSave}>저장</button>
          </div>
        </motion.div>
      </div>
    </>
  );
};

// ── Main Timer Component ────────────────────────────────────
export const TimerDisplay: React.FC = () => {
  const {
    timeLeft, mode, status, cyclesCompleted, cycleInSet, cyclesUntilLongBreak,
    focusDuration, shortBreakDuration, longBreakDuration,
    setMode, setStatus, resetTimer,
  } = useTimerStore();


  const [showSettings, setShowSettings] = React.useState(false);

  const cfg = MODE_CONFIG[mode];
  const totalTime =
    mode === 'focus'      ? focusDuration :
    mode === 'shortBreak' ? shortBreakDuration :
    longBreakDuration;

  const progress     = totalTime > 0 ? (totalTime - timeLeft) / totalTime : 0;
  const dashOffset   = CIRCUMFERENCE * (1 - progress);
  const statusLabel  =
    status === 'running'   ? cfg.statusRunning :
    status === 'paused'    ? cfg.statusPaused  :
    status === 'completed' ? cfg.statusCompleted :
    cfg.statusIdle;

  const handleToggle = () => {
    playClick();
    if (status === 'completed') return;
    setStatus(status === 'running' ? 'paused' : 'running');
  };

  const handleReset = () => {
    playClick();
    resetTimer();
  };

  const handleModeChange = (m: TimerMode) => {
    // 집중 세션 진행 중(실행/일시정지) 모드 전환 방지
    if (status === 'running' || status === 'paused') return;
    playClick();
    setMode(m);
  };

  const isBusy = status === 'running' || status === 'paused';

  // ── Mode tab labels
  const MODES: { id: TimerMode; label: string }[] = [
    { id: 'focus',      label: '집중' },
    { id: 'shortBreak', label: '짧은 휴식' },
    { id: 'longBreak',  label: '긴 휴식' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px 16px 16px',
        width: '100%',
        maxWidth: 400,
        margin: '0 auto',
      }}
    >
      {/* Mobile compact character */}
      <div className="mobile-char-preview" style={{ marginBottom: 0 }}>
        <CharacterView size={100} staticMode />
      </div>

      {/* Mode tabs */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          padding: '4px',
          background: 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(12px)',
          borderRadius: 'var(--radius-full)',
          border: '1.5px solid rgba(255,255,255,0.85)',
          marginBottom: 24,
          marginTop: 8,
        }}
      >
        {MODES.map((m) => {
          const isActive = mode === m.id;
          return (
            <motion.button
              key={m.id}
              onClick={() => handleModeChange(m.id)}
              disabled={isBusy && m.id !== mode}
              title={isBusy && m.id !== mode ? '타이머 진행 중에는 모드를 바꿀 수 없어요' : undefined}
              style={{
                padding: '7px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.78rem',
                fontWeight: 800,
                border: 'none',
                cursor: isBusy && m.id !== mode ? 'not-allowed' : 'pointer',
                background: isActive ? '#fff' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: isActive ? 'var(--shadow-xs)' : 'none',
                opacity: isBusy && m.id !== mode ? 0.4 : 1,
                transition: 'all 0.2s',
              }}
              whileHover={!isActive && !isBusy ? { color: 'var(--text-secondary)' } : {}}
              whileTap={!isBusy || m.id === mode ? { scale: 0.95 } : {}}
            >
              {m.label}
            </motion.button>
          );
        })}
      </div>

      {/* SVG Timer Circle */}
      <div
        style={{
          position: 'relative',
          width: 280,
          height: 280,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
        }}
      >
        <svg
          width={280}
          height={280}
          style={{ position: 'absolute', transform: 'rotate(-90deg)' }}
        >
          <defs>
            <linearGradient id={`grad-${mode}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor={cfg.gradStart} />
              <stop offset="100%" stopColor={cfg.gradEnd}   />
            </linearGradient>
          </defs>
          {/* Track */}
          <circle
            cx={140} cy={140} r={RADIUS}
            fill="none"
            stroke={cfg.trackColor}
            strokeWidth={14}
          />
          {/* Progress */}
          <circle
            cx={140} cy={140} r={RADIUS}
            fill="none"
            stroke={`url(#grad-${mode})`}
            strokeWidth={14}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>

        {/* Center content */}
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
          <motion.div
            key={Math.floor(timeLeft / 60)}
            initial={{ opacity: 0.5, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            style={{
              fontSize: '3.6rem',
              fontWeight: 900,
              color: 'var(--text-primary)',
              lineHeight: 1,
              letterSpacing: '-0.02em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {formatTime(timeLeft)}
          </motion.div>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              marginTop: 6,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {statusLabel}
          </div>
        </div>
      </div>

      {/* Cycle dots */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {Array.from({ length: cyclesUntilLongBreak }).map((_, i) => {
          const filled = i < cycleInSet;
          return (
            <motion.div
              key={i}
              animate={{ scale: i === cycleInSet && status === 'running' ? [1, 1.3, 1] : 1 }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: filled
                  ? `linear-gradient(135deg, ${cfg.gradStart}, ${cfg.gradEnd})`
                  : 'rgba(0,0,0,0.08)',
                border: filled ? 'none' : '1.5px solid rgba(0,0,0,0.10)',
              }}
            />
          );
        })}
      </div>

      {/* Total cycles */}
      <div
        style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          color: 'var(--text-muted)',
          marginBottom: 20,
        }}
      >
        총 완료 세션: {cyclesCompleted}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
        {/* Settings */}
        <motion.button
          className="btn btn-ghost btn-icon"
          onClick={() => { playClick(); setShowSettings(!showSettings); }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
        >
          <Settings size={18} />
        </motion.button>

        {showSettings && (
          <SettingsPanel onClose={() => setShowSettings(false)} />
        )}

        {/* Reset */}
        <motion.button
          className="btn btn-ghost btn-icon"
          onClick={handleReset}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
          style={{ width: 48, height: 48 }}
        >
          <RotateCcw size={20} />
        </motion.button>

        {/* Play / Pause */}
        <motion.button
          onClick={handleToggle}
          disabled={status === 'completed'}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${cfg.gradStart}, ${cfg.gradEnd})`,
            border: 'none',
            cursor: status === 'completed' ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 8px 28px ${cfg.gradStart}55`,
            opacity: status === 'completed' ? 0.6 : 1,
          }}
        >
          {status === 'running'
            ? <Pause size={30} color="#fff" fill="#fff" />
            : <Play  size={30} color="#fff" fill="#fff" style={{ marginLeft: 3 }} />
          }
        </motion.button>

        {/* Spacer for symmetry */}
        <div style={{ width: 48, height: 48 }} />
        <div style={{ width: 48, height: 48 }} />
      </div>
    </div>
  );
};
