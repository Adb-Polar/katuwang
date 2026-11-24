/** In-place Fisher–Yates shuffle driven by `random` (defaults to Math.random). */
export function shuffle<T>(arr: T[], random: () => number = Math.random): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const FNV_OFFSET_BASIS = 2166136261;
const FNV_PRIME = 16777619;
const UINT32_RANGE = 4294967296;

/** FNV-1a: a small, stable string → uint32 hash. */
function hashSeed(seed: string): number {
  let hash = FNV_OFFSET_BASIS;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }
  return hash >>> 0;
}

/** mulberry32: a deterministic PRNG returning floats in [0, 1). */
function seededRandom(seed: string): () => number {
  let state = hashSeed(seed);
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / UINT32_RANGE;
  };
}

/**
 * Returns a shuffled copy whose order depends only on `seed` — the same seed
 * always yields the same order, so a resumed quiz attempt shows its options in
 * the order the taker first saw them without persisting that order.
 */
export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  return shuffle([...items], seededRandom(seed));
}
