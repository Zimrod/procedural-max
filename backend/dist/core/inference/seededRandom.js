"use strict";
// src/core/inference/seededRandom.ts
//
// Deterministic pseudo-random number generator using mulberry32.
// Same seed always produces the same sequence — critical for reproducible scenes.
// Different seed = different video layout while keeping the same prompt.
//
// Usage:
//   const rng = createRng(42);
//   rng.float()        // 0–1
//   rng.range(2, 8)    // float between 2 and 8
//   rng.int(0, 5)      // integer 0–5 inclusive
//   rng.pick(['a','b','c'])  // random element
//   rng.bool(0.7)      // true 70% of the time
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRng = void 0;
const createRng = (seed) => {
    let s = seed >>> 0;
    const next = () => {
        s += 0x6d2b79f5;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    return {
        float: () => next(),
        range: (lo, hi) => lo + next() * (hi - lo),
        int: (lo, hi) => Math.floor(lo + next() * (hi - lo + 1)),
        bool: (probability = 0.5) => next() < probability,
        pick: (arr) => arr[Math.floor(next() * arr.length)],
        shuffle: (arr) => {
            const a = [...arr];
            for (let i = a.length - 1; i > 0; i--) {
                const j = Math.floor(next() * (i + 1));
                [a[i], a[j]] = [a[j], a[i]];
            }
            return a;
        },
    };
};
exports.createRng = createRng;
//# sourceMappingURL=seededRandom.js.map