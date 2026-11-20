import { describe, it, expect, vi } from 'vitest';
import { PRNG } from '../../src/core/rng.js';

describe('PRNG (Mulberry32)', () => {
  it('should produce identical sequence for the same seed', () => {
    const rng1 = new PRNG(12345);
    const rng2 = new PRNG(12345);

    const seq1 = Array.from({ length: 100 }, () => rng1.next());
    const seq2 = Array.from({ length: 100 }, () => rng2.next());

    expect(seq1).toEqual(seq2);
  });

  it('should produce different sequences for different seeds', () => {
    const rng1 = new PRNG(12345);
    const rng2 = new PRNG(54321);

    const seq1 = Array.from({ length: 10 }, () => rng1.next());
    const seq2 = Array.from({ length: 10 }, () => rng2.next());

    expect(seq1).not.toEqual(seq2);
  });

  it('should not call Math.random', () => {
    const spy = vi.spyOn(Math, 'random');
    const rng = new PRNG(42);
    for (let i = 0; i < 50; i++) {
      rng.next();
      rng.nextInt(1, 10);
      rng.nextFloat(0, 100);
    }
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
