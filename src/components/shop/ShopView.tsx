import React, { useState } from 'react';
import { useGameStore } from '../../features/game/useGameStore';
import { GACHA_COST, rollGacha } from '../../data/items';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X } from 'lucide-react';
import { playClick } from '../../utils/audio';

export const ShopView: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { coins, addCoins, addItem } = useGameStore();
  const [lastItem, setLastItem] = useState<{name: string, rarity: string} | null>(null);

  const handleBuy = () => {
    playClick();
    if (coins >= GACHA_COST) {
      addCoins(-GACHA_COST);
      const newItem = rollGacha();
      addItem(newItem);
      setLastItem({ name: newItem.name, rarity: newItem.rarity });
    } else {
      alert('Not enough coins!');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: 50 }}
      className="absolute inset-0 bg-white/90 backdrop-blur-xl z-50 p-6 flex flex-col items-center"
    >
      <div className="w-full flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">Shop</h2>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
          <X />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full">
        <div className="text-center mb-8">
            <ShoppingBag size={64} className="mx-auto mb-4 text-purple-500" />
            <h3 className="text-xl font-bold mb-2">Mystery Box</h3>
            <p className="text-gray-500 mb-4">Get random items!</p>
            <div className="text-lg font-bold text-yellow-600 mb-6">
                {GACHA_COST} Coins
            </div>
            
            <button 
                onClick={handleBuy}
                disabled={coins < GACHA_COST}
                className={`px-8 py-3 rounded-full text-white font-bold shadow-lg transition-transform ${
                    coins >= GACHA_COST 
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:scale-105' 
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
            >
                Buy 1
            </button>
        </div>

        <AnimatePresence>
            {lastItem && (
                <motion.div 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }} 
                    className="p-6 bg-yellow-50 rounded-xl border-2 border-yellow-200 text-center"
                >
                    <p className="text-sm text-gray-500">You got:</p>
                    <p className={`text-xl font-bold ${
                        lastItem.rarity === 'epic' ? 'text-purple-600' : 
                        lastItem.rarity === 'rare' ? 'text-blue-600' : 'text-gray-800'
                    }`}>
                        {lastItem.name}
                    </p>
                    <span className="text-xs uppercase tracking-wider text-gray-400">{lastItem.rarity}</span>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
      
      <div className="w-full py-4 text-center text-gray-400 text-sm">
        Current Coins: {coins}
      </div>
    </motion.div>
  );
};
