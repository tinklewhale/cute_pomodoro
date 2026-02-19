import { useState } from 'react';
import { TimerDisplay } from './components/timer/TimerDisplay';
import { CharacterView } from './components/character/CharacterView';
import { ShopView } from './components/shop/ShopView';
import { InventoryView } from './components/inventory/InventoryView'; // Correct path? Yes.
import { Store, Backpack, Home } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

function App() {
  const [view, setView] = useState<'home' | 'shop' | 'inventory'>('home');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <header className="mb-4">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-red-600" 
            style={{ 
              backgroundImage: 'var(--color-focus-gradient)', 
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text', 
              color: 'transparent' 
            }}>
          Pomodoro Productivity
        </h1>
      </header>
      
      <main className="w-full max-w-4xl glass-panel min-h-[600px] flex items-center justify-center flex-col relative overflow-hidden">
        <CharacterView />
        <TimerDisplay />

        <AnimatePresence>
            {view === 'shop' && <ShopView onClose={() => setView('home')} />}
            {view === 'inventory' && <InventoryView onClose={() => setView('home')} />}
        </AnimatePresence>
      </main>

      {/* Navigation */}
      <nav className="mt-8 flex gap-6 glass-panel px-8 py-4 rounded-full">
        <button 
            onClick={() => setView('home')}
            className={`p-3 rounded-xl transition-all ${view === 'home' ? 'bg-black/10 text-black' : 'text-gray-400 hover:text-gray-600'}`}
        >
            <Home size={24} />
        </button>
        <button 
            onClick={() => setView('shop')}
            className={`p-3 rounded-xl transition-all ${view === 'shop' ? 'bg-purple-100 text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
            <Store size={24} />
        </button>
        <button 
            onClick={() => setView('inventory')}
            className={`p-3 rounded-xl transition-all ${view === 'inventory' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
            <Backpack size={24} />
        </button>
      </nav>
    </div>
  );
}

export default App;
