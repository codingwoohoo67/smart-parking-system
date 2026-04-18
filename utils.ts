import { useEffect, useState } from "react";

/**
 * Returns Date.now() that updates on a tick interval.
 * Default 1s — suitable for live duration counters.
 * The interval is shared per hook instance and cleaned up on unmount.
 */
export function useNow(intervalMs: number = 1000): number {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
