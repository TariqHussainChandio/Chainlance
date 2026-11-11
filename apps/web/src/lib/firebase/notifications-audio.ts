"use client";

/**
 * Web-only notification audio (Web Audio API). Wired into @chainwork/core
 * through ports.audio in lib/core-setup.ts.
 */

let sharedAudioCtx: AudioContext | null = null;

function getSharedAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!sharedAudioCtx) {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (AudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === "suspended") {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

export function unlockAudioContextOnUserGesture() {
  if (typeof window === "undefined") return;
  const unlock = () => {
    const ctx = getSharedAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    ["click", "pointerdown", "touchstart", "keydown"].forEach((evt) => {
      window.removeEventListener(evt, unlock);
    });
  };

  ["click", "pointerdown", "touchstart", "keydown"].forEach((evt) => {
    window.addEventListener(evt, unlock, { once: true, passive: true });
  });
}

/**
 * Web Audio API synthesized bell chime sound.
 * Plays a warm ascending crystal triad chord (C6 -> E6 -> G6).
 */
export function playWebNotificationBell() {
  try {
    const ctx = getSharedAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Ascending Triad Notes: C6 (1046.5Hz), E6 (1318.5Hz), G6 (1567.98Hz)
    const notes = [
      { freq: 1046.5, delay: 0.0, duration: 0.8, gain: 0.4 },
      { freq: 1318.51, delay: 0.08, duration: 0.9, gain: 0.45 },
      { freq: 1567.98, delay: 0.16, duration: 1.2, gain: 0.5 },
    ];

    notes.forEach(({ freq, delay, duration, gain }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + delay);

      gainNode.gain.setValueAtTime(gain, now + delay);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + delay + duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + duration + 0.05);
    });
  } catch (err) {
    console.warn("[playWebNotificationBell] AudioContext sound error:", err);
  }
}
