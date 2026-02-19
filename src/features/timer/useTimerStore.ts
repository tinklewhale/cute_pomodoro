import { create } from 'zustand';

export type TimerMode = 'focus' | 'shortBreak' | 'longBreak';
export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

interface TimerState {
  timeLeft: number;
  mode: TimerMode;
  status: TimerStatus;
  cyclesCompleted: number;
  // Settings (could be moved to a settings store later)
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  
  // Actions
  setTimeLeft: (time: number) => void;
  setMode: (mode: TimerMode) => void;
  setStatus: (status: TimerStatus) => void;
  incrementCycles: () => void;
  resetTimer: () => void;
  tick: () => void;
}

const DEFAULT_FOCUS_TIME = 25 * 60;
const DEFAULT_SHORT_BREAK = 5 * 60;
const DEFAULT_LONG_BREAK = 15 * 60;

export const useTimerStore = create<TimerState>((set, get) => ({
  timeLeft: DEFAULT_FOCUS_TIME,
  mode: 'focus',
  status: 'idle',
  cyclesCompleted: 0,
  focusDuration: DEFAULT_FOCUS_TIME,
  shortBreakDuration: DEFAULT_SHORT_BREAK,
  longBreakDuration: DEFAULT_LONG_BREAK,

  setTimeLeft: (time) => set({ timeLeft: time }),
  
  setMode: (mode) => {
    const { focusDuration, shortBreakDuration, longBreakDuration } = get();
    let newTime;
    switch (mode) {
      case 'focus': newTime = focusDuration; break;
      case 'shortBreak': newTime = shortBreakDuration; break;
      case 'longBreak': newTime = longBreakDuration; break;
    }
    set({ mode, timeLeft: newTime, status: 'idle' });
  },

  setStatus: (status) => set({ status }),

  incrementCycles: () => set((state) => ({ cyclesCompleted: state.cyclesCompleted + 1 })),

  resetTimer: () => {
    const { mode, focusDuration, shortBreakDuration, longBreakDuration } = get();
    let resetTime;
    switch (mode) {
      case 'focus': resetTime = focusDuration; break;
      case 'shortBreak': resetTime = shortBreakDuration; break;
      case 'longBreak': resetTime = longBreakDuration; break;
    }
    set({ timeLeft: resetTime, status: 'idle' });
  },

  tick: () => {
    const { timeLeft, status } = get();
    if (status !== 'running') return;

    if (timeLeft > 0) {
      set({ timeLeft: timeLeft - 1 });
    } else {
      set({ status: 'completed' }); // Logic to handle completion will be in the component or a subscriber
    }
  },
}));
