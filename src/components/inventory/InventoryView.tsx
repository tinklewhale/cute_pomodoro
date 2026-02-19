import React from 'react';
import { useGameStore, type Item } from '../../features/game/useGameStore';
import { motion } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { playClick } from '../../utils/audio';

export const InventoryView: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { inventory, equipped, equipItem } = useGameStore();

  const handleEquip = (item: Item) => {
    playClick();
    equipItem(item.type, item.id);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: 50 }}
      className="absolute inset-0 bg-white/90 backdrop-blur-xl z-50 p-6 flex flex-col"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Inventory</h2>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
          <X />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-4 pb-20">
        {inventory.length === 0 && (
            <div className="col-span-2 text-center text-gray-400 mt-20">
                No items yet. Go to shop!
            </div>
        )}
        {inventory.map((item, idx) => {
            const isEquipped = equipped[item.type] === item.id;
            return (
                <div 
                    key={`${item.id}-${idx}`} 
                    onClick={() => handleEquip(item)}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative ${
                        isEquipped ? 'border-green-500 bg-green-50' : 'border-gray-100 hover:border-gray-300'
                    }`}
                >
                    <div className="font-bold">{item.name}</div>
                    <div className="text-xs text-gray-400 capitalize">{item.type}</div>
                    {isEquipped && <Check className="absolute top-2 right-2 text-green-500" size={16} />}
                </div>
            );
        })}
      </div>
    </motion.div>
  );
};
