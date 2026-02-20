import React from 'react';
import { motion } from 'framer-motion';
import { getItemById } from '../../data/items';
import type { RoomMember } from '../../features/room/useRoomStore';

interface RoomMemberCharacterProps {
  member: RoomMember;
  size?: number;
  staticMode?: boolean;
}

export const RoomMemberCharacter: React.FC<RoomMemberCharacterProps> = ({ member, size = 100, staticMode = false }) => {
  const bgItem   = member.equippedBackground ? getItemById(member.equippedBackground) : null;
  const accItem  = member.equippedAccessory  ? getItemById(member.equippedAccessory)  : null;
  const skinItem = member.equippedSkin       ? getItemById(member.equippedSkin)       : null;

  const bgGradient = bgItem?.assetData ?? 'linear-gradient(160deg, var(--lavender-light) 0%, var(--cream-dark) 100%)';
  const skinFilter  = skinItem?.type === 'skin' ? skinItem.assetData : undefined;

  const isIdle = member.timerStatus === 'idle' || member.timerStatus === 'completed';
  const isPaused = member.timerStatus === 'paused';

  // Format timer
  let timerText = '';
  if (!isIdle) {
    const elapsed = member.timerUpdatedAt ? Math.floor((Date.now() - member.timerUpdatedAt) / 1000) : 0;
    const secsLeft = Math.max(0, member.timerSecondsLeft - elapsed);
    if (!member.timerUpdatedAt && member.timerSecondsLeft === 0) {
      timerText = '--:--';
    } else {
      const m = Math.floor(secsLeft / 60);
      const s = secsLeft % 60;
      timerText = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
  }

  const timerColor = member.timerMode === 'shortBreak' ? '#5EC49A' :
                     member.timerMode === 'longBreak'  ? '#5BA8E5' : 'var(--rose)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: size }}>
      {/* Character Avatar */}
      <div
        style={{
          position: 'relative',
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 8,
        }}
      >
        <motion.div
          animate={staticMode ? {} : { scale: [1, 1.06, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', inset: '5%', borderRadius: '50%',
            background: bgGradient, boxShadow: '0 4px 16px rgba(196, 168, 232, 0.30)',
          }}
        />
        <div style={{
          position: 'absolute', inset: '-4%', borderRadius: '50%',
          background: bgGradient, opacity: 0.25, filter: 'blur(10px)',
        }} />

        <motion.div
          animate={staticMode ? {} : { y: [0, -6, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'relative', zIndex: 2, width: '80%', height: '80%' }}
        >
          <img
             src={`/characters/${member.characterId}.png`}
             alt={member.characterId}
             style={{ width: '100%', height: '100%', objectFit: 'contain', filter: skinFilter }}
             draggable={false}
          />
        </motion.div>

        {accItem && (
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            style={{ position: 'absolute', top: '6%', right: '6%', fontSize: size * 0.18, zIndex: 3, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}
          >
            {accItem.emoji}
          </motion.div>
        )}
      </div>

      {/* Info: Timer */}
      {!isIdle && (
        <div style={{ textAlign: 'center', width: '100%' }}>
          <div style={{ fontWeight: 900, fontSize: size > 120 ? '1.4rem' : '1.1rem', color: 'var(--text-primary)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {timerText}
          </div>
          <div style={{ fontSize: size > 120 ? '0.72rem' : '0.62rem', fontWeight: 700, color: timerColor, marginTop: 4 }}>
            {member.timerMode === 'focus' ? '집중' : member.timerMode === 'shortBreak' ? '짧은 휴식' : '긴 휴식'}
            {isPaused && ' · 일시정지'}
          </div>
          {member.cyclesUntilLongBreak ? (
            <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 6 }}>
              {Array.from({ length: member.cyclesUntilLongBreak }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: i < (member.cycleInSet ?? 0) ? timerColor : 'rgba(0,0,0,0.10)',
                    border: i < (member.cycleInSet ?? 0) ? 'none' : '1px solid rgba(0,0,0,0.10)',
                  }}
                />
              ))}
            </div>
          ) : null}
        </div>
      )}

      {/* Nickname */}
      <div
        style={{
          marginTop: !isIdle ? 8 : 4,
          padding: '4px 12px',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(255, 255, 255, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.85)',
          fontSize: size > 120 ? '0.8rem' : '0.7rem',
          fontWeight: 700,
          color: 'var(--text-secondary)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '100%',
        }}
      >
        {member.nickname}
      </div>
    </div>
  );
};
