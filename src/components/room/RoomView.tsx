import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, LogOut, Users } from 'lucide-react';
import { useRoomStore } from '../../features/room/useRoomStore';
import { useGameStore } from '../../features/game/useGameStore';
import { useTimerStore } from '../../features/timer/useTimerStore';
import { playClick } from '../../utils/audio';
import type { MemberTimerStatus } from '../../features/room/useRoomStore';
import { SESSION_USER_ID } from '../../utils/sessionId';

const pad = (n: number) => String(n).padStart(2, '0');

const STATUS_DOT: Record<MemberTimerStatus, { color: string; label: string }> = {
  idle:      { color: '#D1D5DB', label: '대기' },
  running:   { color: '#FF6B8A', label: '집중 중' },
  paused:    { color: '#FBBF24', label: '일시정지' },
  completed: { color: '#7EDBB7', label: '완료' },
};

function toHHMM(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// 상대방 타이머: 마지막 수신 시각 기준으로 보간해 현재 남은 초 계산
function interpolateSeconds(secondsLeft: number, updatedAt: number, status: MemberTimerStatus): number {
  if (status !== 'running') return secondsLeft;
  const elapsed = Math.floor((Date.now() - updatedAt) / 1000);
  return Math.max(0, secondsLeft - elapsed);
}

export const RoomView: React.FC = () => {
  const { roomId, roomCode, members, isConnected, error, createRoom, joinRoom, leaveRoom, clearError } = useRoomStore();
  const { selectedCharacter, nickname, unlockAchievement, sessionHistory } = useGameStore();
  const { timeLeft, status: timerStatus, mode: timerMode, cycleInSet, cyclesUntilLongBreak } = useTimerStore();

  // 상대방 타이머 보간을 위해 1초마다 리렌더
  const [, forceUpdate] = useState(0);
  const tick = useCallback(() => forceUpdate((n) => n + 1), []);
  useEffect(() => {
    const hasRunning = members.some((m) => m.timerStatus === 'running' && m.userId !== SESSION_USER_ID);
    if (!hasRunning) return;
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [members, tick]);

  // 방 참여/생성 시 DB에 기록할 현재 타이머 상태
  const timerStatusForRoom: MemberTimerStatus =
    timerStatus === 'running'   ? 'running'   :
    timerStatus === 'paused'    ? 'paused'    :
    timerStatus === 'completed' ? 'completed' : 'idle';

  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Today's already-completed focus seconds (passed when joining so ranking starts correctly)
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySeconds = sessionHistory
    .filter((r) => r.date === todayStr)
    .reduce((sum, r) => sum + r.durationSeconds, 0);

  const handleCreate = async () => {
    if (loading) return;
    playClick();
    setLoading(true);
    await createRoom(SESSION_USER_ID, nickname || '익명', selectedCharacter, timerStatusForRoom, todaySeconds);
    setLoading(false);
    unlockAchievement('ach_friends');
  };

  const handleJoin = async () => {
    if (!joinCode.trim() || loading) return;
    playClick();
    setLoading(true);
    await joinRoom(joinCode.trim(), SESSION_USER_ID, nickname || '익명', selectedCharacter, timerStatusForRoom, todaySeconds);
    setLoading(false);
    if (!error) unlockAchievement('ach_friends');
  };

  const handleLeave = async () => {
    playClick();
    await leaveRoom(SESSION_USER_ID);
  };

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Joined state ─────────────────────────────────────────
  if (isConnected && roomId) {
    const sorted = [...members].sort((a, b) => b.focusSecondsToday - a.focusSecondsToday);
    const me = members.find((m) => m.userId === SESSION_USER_ID);

    const timerColor =
      timerMode === 'focus'      ? 'var(--rose)'  :
      timerMode === 'shortBreak' ? '#5EC49A'       : '#5BA8E5';

    return (
      <div style={{ padding: '20px 16px', maxWidth: 500, margin: '0 auto' }}>
        {/* Room code banner */}
        <div
          className="glass-card"
          style={{ padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>방 코드</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--rose)', letterSpacing: '0.12em' }}>{roomCode}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <motion.button
              className="btn btn-ghost btn-icon"
              onClick={handleCopyCode}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.93 }}
              title="코드 복사"
            >
              {copied ? '✓' : <Copy size={16} />}
            </motion.button>
            <motion.button
              className="btn btn-ghost btn-icon"
              onClick={handleLeave}
              whileHover={{ scale: 1.08, color: 'var(--rose)' }}
              whileTap={{ scale: 0.93 }}
              title="나가기"
            >
              <LogOut size={16} />
            </motion.button>
          </div>
        </div>

        {/* My status card with timer display */}
        {me && (
          <div
            className="glass-card"
            style={{ padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, border: '2px solid rgba(255, 107, 138, 0.25)' }}
          >
            <img src={`/characters/${me.characterId}.png`} alt="" style={{ width: 40, height: 40, objectFit: 'contain' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{me.nickname} (나)</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>{STATUS_DOT[me.timerStatus].label}</div>
              {/* Live timer countdown */}
              {timerStatus !== 'idle' && timerStatus !== 'completed' && (
                <div style={{ fontSize: '0.9rem', fontWeight: 900, color: timerColor, marginTop: 2 }}>
                  {pad(Math.floor(timeLeft / 60))}:{pad(timeLeft % 60)}
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginLeft: 7 }}>
                    {cycleInSet + 1}/{cyclesUntilLongBreak}
                  </span>
                </div>
              )}
            </div>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: STATUS_DOT[me.timerStatus].color }} />
          </div>
        )}

        {/* Members header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Users size={16} color="var(--text-muted)" />
          <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            참여자 {members.length}/10
          </span>
          <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.06)' }} />
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>집중 랭킹</span>
        </div>

        {/* Member list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sorted.map((member, idx) => {
            const dot = STATUS_DOT[member.timerStatus];
            const isMe = member.userId === SESSION_USER_ID;
            return (
              <motion.div
                key={member.userId}
                layout
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: isMe ? 'rgba(255, 107, 138, 0.07)' : 'rgba(255, 255, 255, 0.6)',
                  border: isMe ? '1.5px solid rgba(255, 107, 138, 0.22)' : '1.5px solid rgba(255,255,255,0.85)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                {/* Rank */}
                <div style={{
                  width: 24, height: 24,
                  borderRadius: '50%',
                  background: idx === 0 ? 'var(--gold)' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : 'rgba(0,0,0,0.07)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 900,
                  color: idx < 3 ? '#fff' : 'var(--text-muted)',
                  flexShrink: 0,
                }}>
                  {idx + 1}
                </div>

                {/* Character with timer pill overlay */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <img
                    src={`/characters/${member.characterId}.png`}
                    alt={member.characterId}
                    style={{ width: 36, height: 36, objectFit: 'contain', display: 'block' }}
                  />
                  {isMe && timerStatus === 'running' && (
                    <div style={{
                      position: 'absolute',
                      bottom: -7, left: '50%',
                      transform: 'translateX(-50%)',
                      background: timerColor,
                      color: '#fff',
                      fontSize: '0.52rem',
                      fontWeight: 900,
                      padding: '1px 5px',
                      borderRadius: 99,
                      whiteSpace: 'nowrap',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                    }}>
                      {pad(Math.floor(timeLeft / 60))}:{pad(timeLeft % 60)}
                    </div>
                  )}
                  {!isMe && member.timerStatus === 'running' && member.timerSecondsLeft > 0 && (() => {
                    const secs = interpolateSeconds(member.timerSecondsLeft, member.timerUpdatedAt, member.timerStatus);
                    return secs > 0 ? (
                      <div style={{
                        position: 'absolute',
                        bottom: -7, left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'var(--rose)',
                        color: '#fff',
                        fontSize: '0.52rem',
                        fontWeight: 900,
                        padding: '1px 5px',
                        borderRadius: 99,
                        whiteSpace: 'nowrap',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                      }}>
                        {pad(Math.floor(secs / 60))}:{pad(secs % 60)}
                      </div>
                    ) : null;
                  })()}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {member.nickname}{isMe && ' ✦'}
                  </div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot.color, display: 'inline-block', flexShrink: 0 }} />
                    {dot.label}
                  </div>
                </div>

                {/* Focus time */}
                <div style={{ fontWeight: 900, fontSize: '0.82rem', color: 'var(--text-secondary)', flexShrink: 0 }}>
                  {toHHMM(member.focusSecondsToday)}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Lobby state ───────────────────────────────────────────
  return (
    <div style={{ padding: '20px 16px', maxWidth: 440, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>👥</div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: 6 }}>
          친구와 함께 공부해요!
        </h2>
        <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          방을 만들거나 코드로 참여하세요. 최대 10명 동시 접속.
        </p>
      </div>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              padding: '12px 16px',
              background: 'rgba(255, 107, 138, 0.10)',
              border: '1.5px solid rgba(255, 107, 138, 0.35)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <span style={{ fontSize: '0.83rem', fontWeight: 700, color: 'var(--rose-dark)' }}>{error}</span>
            <button
              onClick={clearError}
              style={{ background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer', color: 'var(--rose)' }}
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 0,
          background: 'rgba(255,255,255,0.5)',
          border: '1.5px solid rgba(255,255,255,0.85)',
          borderRadius: 'var(--radius-md)',
          padding: 4,
          marginBottom: 20,
        }}
      >
        {(['create', 'join'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { playClick(); setTab(t); }}
            style={{
              padding: '10px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 800,
              fontSize: '0.88rem',
              background: tab === t ? '#fff' : 'transparent',
              color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: tab === t ? 'var(--shadow-xs)' : 'none',
              transition: 'all 0.2s',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {t === 'create' ? '🏠 방 만들기' : '🔑 코드로 참여'}
          </button>
        ))}
      </div>

      {tab === 'create' ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          {/* Character preview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', background: 'rgba(255,255,255,0.6)', borderRadius: 'var(--radius-md)', border: '1.5px solid rgba(255,255,255,0.85)', width: '100%' }}>
            <img src={`/characters/${selectedCharacter}.png`} alt="" style={{ width: 48, height: 48, objectFit: 'contain' }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{nickname || '익명'}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>방장으로 참여</div>
            </div>
          </div>

          <motion.button
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
            onClick={handleCreate}
            disabled={loading}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            {loading ? '방 생성 중...' : '방 만들기 🏠'}
          </motion.button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            ref={inputRef}
            className="input-field"
            type="text"
            placeholder="6자리 방 코드 입력 (예: ABC123)"
            maxLength={6}
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && void handleJoin()}
            autoFocus
            style={{ textAlign: 'center', fontSize: '1.3rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}
          />
          <motion.button
            onClick={() => void handleJoin()}
            disabled={joinCode.trim().length < 4 || loading}
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '1rem',
              opacity: joinCode.trim().length >= 4 ? 1 : 0.5,
              background: 'var(--lavender-grad)',
              color: '#fff',
              borderRadius: 'var(--radius-full)',
              fontWeight: 800,
              border: 'none',
              cursor: joinCode.trim().length >= 4 && !loading ? 'pointer' : 'not-allowed',
            }}
            whileHover={joinCode.trim().length >= 4 ? { scale: 1.02, y: -2 } : {}}
            whileTap={joinCode.trim().length >= 4 ? { scale: 0.97 } : {}}
          >
            {loading ? '참여 중...' : '참여하기 →'}
          </motion.button>
        </div>
      )}
    </div>
  );
};
