import { useCallback, useEffect, useState } from "react";

const SOUND_KEY = "vit-parking-sound-enabled";

export type SoundKind = "entry" | "exit" | "error";

let _ctx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (_ctx) return _ctx;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    _ctx = new Ctor();
  } catch {
    _ctx = null;
  }
  return _ctx;
}

/** Short, lightweight tones generated via WebAudio — no asset files needed. */
function tone(freq: number, durationMs: number, type: OscillatorType = "sine", gain = 0.08) {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(gain, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
  osc.connect(g).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + durationMs / 1000 + 0.02);
}

function playKind(kind: SoundKind) {
  switch (kind) {
    case "entry":
      // Pleasant rising two-tone beep
      tone(660, 90, "sine", 0.08);
      setTimeout(() => tone(990, 130, "sine", 0.08), 90);
      break;
    case "exit":
      // Descending two-tone confirmation
      tone(880, 90, "sine", 0.07);
      setTimeout(() => tone(523, 160, "sine", 0.07), 90);
      break;
    case "error":
      // Soft low buzz
      tone(220, 180, "square", 0.05);
      break;
  }
}

export function loadSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const v = localStorage.getItem(SOUND_KEY);
  return v === null ? true : v === "1";
}

export function saveSoundEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SOUND_KEY, enabled ? "1" : "0");
}

/** App-wide sound preference + play helper. */
export function useSound() {
  const [enabled, setEnabled] = useState<boolean>(true);

  useEffect(() => {
    setEnabled(loadSoundEnabled());
    const onStorage = (e: StorageEvent) => {
      if (e.key === SOUND_KEY) setEnabled(loadSoundEnabled());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setAndSave = useCallback((v: boolean) => {
    setEnabled(v);
    saveSoundEnabled(v);
  }, []);

  const play = useCallback(
    (kind: SoundKind) => {
      if (!loadSoundEnabled()) return;
      try {
        playKind(kind);
      } catch {
        /* ignore audio errors */
      }
    },
    [],
  );

  return { enabled, setEnabled: setAndSave, play };
}
