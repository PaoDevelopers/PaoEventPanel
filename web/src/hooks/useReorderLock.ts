import { useEffect, useState } from "react";

// Long enough to cover the row reorder animation
const LOCK_MS = 700;

// True briefly after the ranking order changes, so a repeated tap can't land on a row that just moved under the pointer
export function useReorderLock(ids: number[]): boolean {
  const key = ids.join(",");
  const [prevKey, setPrevKey] = useState(key);
  const [locked, setLocked] = useState(false);

  if (key !== prevKey) {
    setPrevKey(key);
    setLocked(true);
  }

  useEffect(() => {
    if (!locked) return;
    const timer = setTimeout(() => setLocked(false), LOCK_MS);
    return () => clearTimeout(timer);
  }, [locked, key]);

  return locked;
}
