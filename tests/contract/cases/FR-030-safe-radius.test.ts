import { describe, it, expect, afterEach } from 'vitest';
import { runCliSync } from '../cli-helper.js';
import fs from 'node:fs';
import path from 'node:path';
import { TUNING } from '../../../src/core/tuning.js';

describe('FR-030: Lit lantern safe radius push for shades', () => {
  const cleanups: string[] = [];

  afterEach(() => {
    for (const f of cleanups) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    cleanups.length = 0;
  });

  it('pushes shades out of safe_radius around lit lantern', () => {
    const scenarioPath = path.resolve('temp_safe_radius_scenario.json');
    cleanups.push(scenarioPath);

    // Lantern L1 at (0, 0, 25) lit: true
    // Player at (0, 0, 25)
    // Shade starting inside safe radius at (0, 1, 22) (dist to L1 = 3m < 6m)
    fs.writeFileSync(
      scenarioPath,
      JSON.stringify({
        player: { pos: [0, 0, 25] },
        random_motes: false,
        random_shades: false,
        motes: [],
        lanterns: [{ id: 'L1', pos: [0, 0, 25], lit: true }],
        shades: [{ id: 'S1', pos: [0, 1, 22] }],
      })
    );

    const res = runCliSync({
      seed: 42,
      night: 1,
      ticks: 5,
      snapshotEvery: 1,
      scenarioPath,
    });
    cleanups.push(res.outputPath);

    expect(res.status).toBe(0);
    const lines = res.readLines<any>();

    // For each snapshot from tick 1 onwards, distance from S1 to L1 must be >= safe_radius
    const snapshots = lines.filter((l) => l.type === 'snapshot' && l.tick >= 1);
    expect(snapshots.length).toBeGreaterThan(0);

    for (const snap of snapshots) {
      const shade = snap.shades.find((s: any) => s.id === 'S1');
      const dx = shade.pos[0] - 0;
      const dz = shade.pos[2] - 25;
      const dist = Math.sqrt(dx * dx + dz * dz);
      expect(dist).toBeGreaterThanOrEqual(TUNING.safe_radius - 0.01);
    }
  });
});
