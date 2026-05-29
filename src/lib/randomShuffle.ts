/** Fisher–Yates shuffle (copy). */
export function randomShuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/** Small, fast deterministic PRNG (mulberry32). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Deterministic Fisher–Yates shuffle seeded by `seed`.
 * The same (arr, seed) always produces the same order, so a seed generated
 * once on the server and reused on the client yields identical SSR/CSR output
 * (no post-hydration reorder / layout jump under the user's finger).
 */
export function seededShuffle<T>(arr: T[], seed: number): T[] {
  const copy = [...arr]
  const rand = mulberry32(seed)
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}
