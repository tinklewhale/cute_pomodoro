import React from 'react';
import { useGameStore } from '../../features/game/useGameStore';
import { motion } from 'framer-motion';

export const CharacterView: React.FC = () => {
  const { equipped } = useGameStore();

  return (
    <div className="relative w-64 h-64 mx-auto mb-8 flex items-center justify-center">
      {/* Background/Aura */}
      <motion.div 
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-purple-100 rounded-full opacity-50 blur-xl"
      />

      {/* Base Character (Cat Placeholder) */}
      <div className="relative z-10 w-40 h-40 bg-white rounded-full shadow-lg flex items-center justify-center overflow-hidden border-4 border-white">
        {/* Simple SVG Cat */}
        <svg viewBox="0 0 100 100" className="w-full h-full">
            {/* Body */}
            <circle cx="50" cy="60" r="30" fill="#f0f0f0" />
            
            {/* Ears */}
            <path d="M 30 35 L 20 10 L 40 30 Z" fill="#f0f0f0" />
            <path d="M 70 35 L 80 10 L 60 30 Z" fill="#f0f0f0" />
            
            {/* Eyes */}
            <circle cx="40" cy="55" r="3" fill="#333" />
            <circle cx="60" cy="55" r="3" fill="#333" />
            
            {/* Mouth */}
            <path d="M 45 65 Q 50 70 55 65" stroke="#333" strokeWidth="2" fill="none" />

             {/* Dynamic Equipped Items (Simple overlays) */}
             {equipped.accessory === 'acc_glasses' && ( 
                 <g>
                     <circle cx="40" cy="55" r="6" stroke="black" strokeWidth="2" fill="none" />
                     <circle cx="60" cy="55" r="6" stroke="black" strokeWidth="2" fill="none" />
                     <line x1="46" y1="55" x2="54" y2="55" stroke="black" strokeWidth="2" />
                 </g>
             )}

            {equipped.accessory === 'acc_cap' && (
                 <path d="M 20 20 L 80 20 L 80 10 Q 50 0 20 10 Z" fill="#3498db" />
            )}

            {equipped.accessory === 'acc_crown' && (
                 <path d="M 30 20 L 40 10 L 50 25 L 60 10 L 70 20 L 70 30 L 30 30 Z" fill="#f1c40f" />
            )}

            {equipped.top === 'outfit_ninja' && (
                 <path d="M 20 60 Q 50 100 80 60" fill="#2c3e50" opacity="0.8" />
            )}
        </svg>

      </div>
      
      {/* Platform/Shadow */}
      <div className="absolute bottom-10 w-32 h-4 bg-black/10 blur-md rounded-full" />
    </div>
  );
};
