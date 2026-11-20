import { describe, it, expect, afterEach } from 'vitest';
import { runCliSync } from '../cli-helper.js';
import fs from 'node:fs';

describe('FR-040: Absolute determinism across identical runs', () => {
  const cleanups: string[] = [];

  afterEach(() => {
    for (const f of cleanups) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    cleanups.length = 0;
  });

  it('generates 100% byte-identical JSONL output for identical seed and inputs', () => {
    const res1 = runCliSync({
      seed: 98765,
      night: 1,
      ticks: 150,
      snapshotEvery: 10,
    });
    cleanups.push(res1.outputPath);

    const res2 = runCliSync({
      seed: 98765,
      night: 1,
      ticks: 150,
      snapshotEvery: 10,
    });
    cleanups.push(res2.outputPath);

    expect(res1.status).toBe(0);
    expect(res2.status).toBe(0);

    const buf1 = fs.readFileSync(res1.outputPath);
    const buf2 = fs.readFileSync(res2.outputPath);

    expect(buf1.length).toBeGreaterThan(0);
    expect(buf1.equals(buf2)).toBe(true);
  });
});
