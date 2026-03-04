const STORAGE_KEY = "workout-sounds-enabled";

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    try {
      audioCtx = new AudioContext();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) !== "false";
}

export function setSoundEnabled(enabled: boolean) {
  localStorage.setItem(STORAGE_KEY, String(enabled));
}

function playTone(freq: number, duration: number, type: OscillatorType = "sine") {
  if (!isSoundEnabled()) return;
  const ctx = getCtx();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

export function playXPTick() {
  playTone(880, 0.08, "sine");
}

export function playSetLogged() {
  playTone(660, 0.1, "sine");
  setTimeout(() => playTone(880, 0.1, "sine"), 80);
}

export function playPR() {
  playTone(523, 0.15, "triangle");
  setTimeout(() => playTone(659, 0.15, "triangle"), 120);
  setTimeout(() => playTone(784, 0.2, "triangle"), 240);
}

export function playLevelUp() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.2, "triangle"), i * 150);
  });
}

export function playBossDefeated() {
  const notes = [392, 523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.25, "square"), i * 120);
  });
}
