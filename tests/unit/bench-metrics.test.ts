import { expect, it } from 'vitest';
import { frameMetrics } from '../../src/bench/metrics.js';
it('FR4-004 calcula média, pior 1% e p95 nearest-rank', () => {
  const result = frameMetrics(Array.from({length: 100}, (_, i) => i + 1));
  expect(result.frames).toBe(100); expect(result.avg_fps).toBeCloseTo(100000 / 5050);
  expect(result.p1_low_fps).toBe(10); expect(result.frame_ms_p95).toBe(95);
  expect(frameMetrics([20]).p1_low_fps).toBe(50);
  expect(() => frameMetrics([])).toThrow();
});
