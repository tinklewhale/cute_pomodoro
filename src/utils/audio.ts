// =========================================================
// CUTE POMODORO — Audio (Web Audio API)
// No external CDN needed — synthesized sounds only.
// =========================================================

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playTone(
  frequency: number,
  type: OscillatorType,
  duration: number,
  gain = 0.25,
  delayMs = 0
): void {
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') void ctx.resume();

    const startAt = ctx.currentTime + delayMs / 1000;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, startAt);

    gainNode.gain.setValueAtTime(0, startAt);
    gainNode.gain.linearRampToValueAtTime(gain, startAt + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startAt + duration);

    osc.start(startAt);
    osc.stop(startAt + duration + 0.05);
  } catch {
    // Silently fail (e.g., SSR or restricted browser contexts)
  }
}

/** Soft "pop" feedback for button clicks */
export function playClick(): void {
  playTone(520, 'sine', 0.07, 0.12);
}

/** Cheerful 3-note chime: C5 → E5 → G5 (session complete) */
export function playNotification(): void {
  playTone(523, 'sine', 0.28, 0.22, 0);
  playTone(659, 'sine', 0.28, 0.22, 150);
  playTone(784, 'sine', 0.45, 0.22, 300);
}

/** Rising sparkle for item reward claim */
export function playRewardClaim(): void {
  playTone(784, 'sine', 0.14, 0.18, 0);
  playTone(988, 'sine', 0.14, 0.18, 80);
  playTone(1175, 'sine', 0.14, 0.18, 160);
  playTone(1568, 'sine', 0.30, 0.18, 240);
}

/** Gentle error buzz */
export function playError(): void {
  playTone(220, 'square', 0.15, 0.10);
}
