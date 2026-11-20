import { describe, it, expect, afterEach } from 'vitest';
import { runCliSync } from '../cli-helper.js';
import fs from 'node:fs';
import path from 'node:path';

describe('Performance contract test (SC-002 / T032)', () => {
  const cleanups: string[] = [];

  afterEach(() => {
    for (const f of cleanups) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    cleanups.length = 0;
  });

  it('runs 18,000 steps without early exit in under 2 seconds', () => {
    const scenarioPath = path.resolve('temp_perf_scenario.json');
    cleanups.push(scenarioPath);

    // 18,000 steps = 300 seconds. Set time_left_s to 350 to avoid early dawn loss.
    fs.writeFileSync(
      scenarioPath,
      JSON.stringify({
        player: { pos: [0, 0, 0], flames: 3 },
        random_motes: false,
        random_shades: false,
        motes: [],
        shades: [],
        time_left_s: 350,
      })
    );

    const startTime = performance.now();
    const res = runCliSync({
      seed: 42,
      night: 1,
      ticks: 18000,
      snapshotEvery: 600,
      scenarioPath,
    });
    const elapsedMs = performance.now() - startTime;
    cleanups.push(res.outputPath);

    expect(res.status).toBe(0);
    const lines = res.readLines<any>();
    const last = lines[lines.length - 1];

    expect(last.type).toBe('end');
    expect(last.ticks).toBe(18000);
    expect(last.state).toBe('playing');

    console.log(`[PERF] 18,000 steps elapsed time: ${elapsedMs.toFixed(2)} ms`);
    expect(elapsedMs).toBeLessThan(2000);
  });
});
