import React, { useEffect } from 'react';
import { useTimerStore, type TimerMode } from '../../features/timer/useTimerStore';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { playClick, playNotification } from '../../utils/audio';
import { useGameStore } from '../../features/game/useGameStore';

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const MODE_COLORS = {
  focus: 'var(--color-focus-gradient)',
  shortBreak: 'var(--color-break-gradient)',
  longBreak: 'var(--color-long-break-gradient)',
};

const MODE_LABELS: Record<TimerMode, string> = {
  focus: 'Focus Time',
  shortBreak: 'Short Break',
  longBreak: 'Long Break',
};

export const TimerDisplay: React.FC = () => {
  const { 
    timeLeft, 
    mode, 
    status, 
    tick, 
    setStatus, 
    resetTimer, 
    setMode,
    incrementCycles,
    focusDuration,
    shortBreakDuration,
    longBreakDuration
  } = useTimerStore();

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (status === 'running') {
      interval = setInterval(tick, 1000);
    }
     // @ts-ignore
    return () => clearInterval(interval);
  }, [status, tick]);

  const { addCoins } = useGameStore();

  useEffect(() => {
    if (status === 'completed') {
      playNotification();
      if (mode === 'focus') {
        addCoins(100); // Reward for focus
        incrementCycles(); 
      }
    }
  }, [status, mode, addCoins]);

  const toggleTimer = () => {
    playClick();
    if (status === 'running') setStatus('paused');
    else setStatus('running');
  };

  const handleModeChange = (newMode: TimerMode) => {
      setMode(newMode);
  };

  const totalTime = mode === 'focus' ? focusDuration : mode === 'shortBreak' ? shortBreakDuration : longBreakDuration;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  return (
    <div className="flex flex-col items-center justify-center p-8 w-full max-w-md">
       {/* Mode Selectors */}
       <div className="flex gap-4 mb-8 p-1 bg-white/50 backdrop-blur-sm rounded-full border border-white/20">
        {(['focus', 'shortBreak', 'longBreak'] as TimerMode[]).map((m) => (
          <button
            key={m}
            onClick={() => handleModeChange(m)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              mode === m 
                ? 'bg-white shadow-sm text-gray-800 scale-105' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      {/* Timer Circle */}
      <div className="relative w-72 h-72 flex items-center justify-center mb-8">
        {/* Background Circle */}
        <svg className="absolute w-full h-full transform -rotate-90">
          <circle
            cx="144"
            cy="144"
            r="130"
            stroke="rgba(0,0,0,0.05)"
            strokeWidth="12"
            fill="none"
          />
          <circle
            cx="144"
            cy="144"
            r="130"
            stroke="url(#gradient)" 
            strokeWidth="12"
            fill="none"
            strokeDasharray={2 * Math.PI * 130}
            strokeDashoffset={2 * Math.PI * 130 * (1 - progress / 100)} // Inverted logic for filling up? Or depleting? Usually timers deplete. Let's make it deplete.
             // Actually, usually progress bars fill up or deplete. Let's make it fill up for "Time Elapsed" or deplete for "Time Left".
             // Let's go with Depleting: Full circle at start.
             // StrokeDashoffset: 0 = Full.
             // Value should go from 0 to MAX.
             // If we want it to shrink: offset increases.
             style={{
                 transition: 'stroke-dashoffset 1s linear',
                 strokeLinecap: 'round' 
             }}
          />
           <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              {mode === 'focus' && <>
                <stop offset="0%" stopColor="#ff6b6b" />
                <stop offset="100%" stopColor="#ee5253" />
              </>}
              {mode === 'shortBreak' && <>
                <stop offset="0%" stopColor="#4ecdc4" />
                <stop offset="100%" stopColor="#22a6b3" />
              </>}
               {mode === 'longBreak' && <>
                <stop offset="0%" stopColor="#45b7d1" />
                <stop offset="100%" stopColor="#2980b9" />
              </>}
            </linearGradient>
          </defs>
        </svg>

        {/* Time Text */}
        <div className="flex flex-col items-center z-10">
            <motion.div 
                key={timeLeft}
                initial={{ opacity: 0.5, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-6xl font-bold tracking-tighter"
                style={{ color: 'var(--color-text-primary)' }}
            >
                {formatTime(timeLeft)}
            </motion.div>
            <div className="text-sm font-medium uppercase tracking-widest mt-2 text-gray-400">
                {status === 'running' ? 'Focusing...' : status === 'paused' ? 'Paused' : 'Ready'}
            </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6">
        <button 
            onClick={resetTimer}
            className="p-4 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
            title="Reset"
        >
            <RotateCcw size={24} />
        </button>

        <button 
            onClick={toggleTimer}
            className="p-6 rounded-full text-white shadow-lg transform transition-all hover:scale-105 active:scale-95"
            style={{ background: MODE_COLORS[mode] }}
        >
            {status === 'running' ? <Pause size={32} fill="white" /> : <Play size={32} fill="white" className="ml-1" />}
        </button>
      </div>
    </div>
  );
};
