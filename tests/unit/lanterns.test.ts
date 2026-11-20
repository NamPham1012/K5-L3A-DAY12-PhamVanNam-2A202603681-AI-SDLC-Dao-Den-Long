import { describe, expect, it } from 'vitest';
import { findBestLanternToDeposit } from '../../src/core/lanterns.js';
import type { Lantern } from '../../src/core/entities.js';

describe('FR3-004: chọn đèn nhận được', () => {
  it('bỏ qua đèn sáng đầy dầu và chọn đèn chưa sáng trong tầm', () => {
    const full: Lantern = { id: 'L1', pos: [0, 0, 1], lit: true, fuel_u: 6000, deposited: 10, ever_lit: true, relit_count: 0 };
    const unlit: Lantern = { id: 'L2', pos: [0, 0, 1.5], lit: false, fuel_u: 0, deposited: 0, ever_lit: false, relit_count: 0 };
    expect(findBestLanternToDeposit([0, 0, 0], [full, unlit], 2)).toBe(unlit);
    expect(findBestLanternToDeposit([0, 0, 0], [full], 2)).toBeNull();
  });
});
