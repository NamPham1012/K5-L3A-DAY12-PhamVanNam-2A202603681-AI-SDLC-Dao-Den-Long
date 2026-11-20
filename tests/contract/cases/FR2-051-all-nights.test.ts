import { describe, it, expect, afterEach } from 'vitest';
import { runCliSync } from '../cli-helper.js';
import fs from 'node:fs';

describe('FR2-051: All three nights (--night 1, 2, 3) contract compliance & byte determinism', () => {
  const cleanups: string[] = [];

  afterEach(() => {
    for (const f of cleanups) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    cleanups.length = 0;
  });

  for (const cfg of [
    { night: 1, duration: 240, lanterns: 5 },
    { night: 2, duration: 270, lanterns: 6 },
    { night: 3, duration: 300, lanterns: 7 },
  ]) {
    it(`FR2-051: Night ${cfg.night} runs deterministically with ${cfg.lanterns} lanterns and ${cfg.duration}s`, () => {
      const r1 = runCliSync({ seed: 77, night: cfg.night, ticks: 60, snapshotEvery: 30 });
      const r2 = runCliSync({ seed: 77, night: cfg.night, ticks: 60, snapshotEvery: 30 });
      cleanups.push(r1.outputPath, r2.outputPath);

      expect(r1.status).toBe(0);
      expect(r2.status).toBe(0);
      expect(fs.readFileSync(r1.outputPath).equals(fs.readFileSync(r2.outputPath))).toBe(true);

      const lines = r1.readLines<any>();
      expect(lines[0]).toEqual({
        type: 'event',
        tick: 0,
        name: 'night_start',
        data: { night: cfg.night },
      });

      const snap0 = lines[1];
      expect(snap0.night).toBe(cfg.night);
      expect(snap0.time_left_s).toBe(cfg.duration);
      expect(snap0.lanterns).toHaveLength(cfg.lanterns);
    });
  }
});
