import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../features/game/useGameStore';
import { getItemById } from '../../data/items';

interface CharacterViewProps {
  size?: number;
  /** If true, skip the floating animation (for compact previews) */
  staticMode?: boolean;
}

export const CharacterView: React.FC<CharacterViewProps> = ({ size = 200, staticMode = false }) => {
  const { selectedCharacter, equipped } = useGameStore();

  const bgItem   = equipped.background ? getItemById(equipped.background) : null;
  const accItem  = equipped.accessory  ? getItemById(equipped.accessory)  : null;
  const skinItem = equipped.skin       ? getItemById(equipped.skin)       : null;

  const bgGradient = bgItem?.assetData ?? 'linear-gradient(160deg, var(--lavender-light) 0%, var(--cream-dark) 100%)';
  const skinFilter  = skinItem?.type === 'skin' ? skinItem.assetData : undefined;

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Background glow circle */}
      <motion.div
        animate={staticMode ? {} : { scale: [1, 1.06, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          inset: '5%',
          borderRadius: '50%',
          background: bgGradient,
          boxShadow: '0 8px 32px rgba(196, 168, 232, 0.30)',
        }}
      />

      {/* Soft outer halo */}
      <div style={{
        position: 'absolute',
        inset: '-4%',
        borderRadius: '50%',
        background: bgGradient,
        opacity: 0.25,
        filter: 'blur(16px)',
      }} />

      {/* Character PNG */}
      <motion.div
        animate={staticMode ? {} : { y: [0, -8, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'relative',
          zIndex: 2,
          width: '80%',
          height: '80%',
        }}
      >
        <img
          src={`/characters/${selectedCharacter}.png`}
          alt={selectedCharacter}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            filter: skinFilter,
            imageRendering: 'auto',
          }}
          draggable={false}
        />
      </motion.div>

      {/* Accessory emoji overlay (top-right) */}
      {accItem && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={{
            position: 'absolute',
            top: '6%',
            right: '6%',
            fontSize: size * 0.18,
            zIndex: 3,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))',
          }}
        >
          {accItem.emoji}
        </motion.div>
      )}

      {/* Ground shadow */}
      <div style={{
        position: 'absolute',
        bottom: '2%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '55%',
        height: size * 0.04,
        background: 'rgba(61, 44, 44, 0.10)',
        borderRadius: '50%',
        filter: 'blur(6px)',
        zIndex: 1,
      }} />
    </div>
  );
};
