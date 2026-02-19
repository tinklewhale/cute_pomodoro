import { create } from 'zustand';

export type TimerMode = 'focus' | 'shortBreak' | 'longBreak';
export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

interface TimerState {
  timeLeft: number;
  mode: TimerMode;
  status: TimerStatus;
  cyclesCompleted: number;   // total focus cycles ever completed
  cycleInSet: number;        // 0-3, resets after long break
  focusStartTime: Date | null;

  // Settings
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  cyclesUntilLongBreak: number;

  // Actions
  setMode: (mode: TimerMode) => void;
  setStatus: (status: TimerStatus) => void;
  resetTimer: () => void;
  tick: () => void;
  /** Called after focus completes: auto-switch to break mode */
  advanceCycle: () => void;
  /** Called after break completes: switch back to focus */
  advanceToFocus: () => void;
  setDurations: (focus: number, shortBreak: number, longBreak: number) => void;
}

const DEFAULT_FOCUS       = 25 * 60;
const DEFAULT_SHORT_BREAK =  5 * 60;
const DEFAULT_LONG_BREAK  = 15 * 60;
const DEFAULT_CYCLES      = 4;

export const useTimerStore = create<TimerState>((set, get) => ({
  timeLeft:            DEFAULT_FOCUS,
  mode:                'focus',
  status:              'idle',
  cyclesCompleted:     0,
  cycleInSet:          0,
  focusStartTime:      null,
  focusDuration:       DEFAULT_FOCUS,
  shortBreakDuration:  DEFAULT_SHORT_BREAK,
  longBreakDuration:   DEFAULT_LONG_BREAK,
  cyclesUntilLongBreak: DEFAULT_CYCLES,

  setMode: (mode) => {
    const { focusDuration, shortBreakDuration, longBreakDuration } = get();
    const newTime =
      mode === 'focus'      ? focusDuration :
      mode === 'shortBreak' ? shortBreakDuration :
      longBreakDuration;
    set({ mode, timeLeft: newTime, status: 'idle', focusStartTime: null });
  },

  setStatus: (status) => {
    set((state) => ({
      status,
      focusStartTime:
        status === 'running' && state.mode === 'focus' && state.focusStartTime === null
          ? new Date()
          : state.focusStartTime,
    }));
  },

  resetTimer: () => {
    const { mode, focusDuration, shortBreakDuration, longBreakDuration } = get();
    const resetTime =
      mode === 'focus'      ? focusDuration :
      mode === 'shortBreak' ? shortBreakDuration :
      longBreakDuration;
    set({ timeLeft: resetTime, status: 'idle', focusStartTime: null });
  },

  tick: () => {
    const { timeLeft, status } = get();
    if (status !== 'running') return;
    if (timeLeft > 0) {
      set({ timeLeft: timeLeft - 1 });
    } else {
      set({ status: 'completed' });
    }
  },

  advanceCycle: () => {
    const { cyclesCompleted, cycleInSet, cyclesUntilLongBreak, shortBreakDuration, longBreakDuration } = get();
    const newCyclesCompleted = cyclesCompleted + 1;
    const newCycleInSet = cycleInSet + 1;
    const isLongBreak = newCycleInSet >= cyclesUntilLongBreak;
    const nextMode: TimerMode = isLongBreak ? 'longBreak' : 'shortBreak';
    const nextTime = isLongBreak ? longBreakDuration : shortBreakDuration;
    set({
      cyclesCompleted: newCyclesCompleted,
      cycleInSet:      isLongBreak ? 0 : newCycleInSet,
      mode:            nextMode,
      timeLeft:        nextTime,
      status:          'idle',
      focusStartTime:  null,
    });
  },

  advanceToFocus: () => {
    const { focusDuration } = get();
    set({ mode: 'focus', timeLeft: focusDuration, status: 'idle', focusStartTime: null });
  },

  setDurations: (focus, shortBreak, longBreak) => {
    set({
      focusDuration:      focus,
      shortBreakDuration: shortBreak,
      longBreakDuration:  longBreak,
    });
  },
}));
