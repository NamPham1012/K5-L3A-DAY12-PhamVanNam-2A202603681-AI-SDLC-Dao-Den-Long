import { describe, it, expect, afterEach } from 'vitest';
import { runCliSync } from '../cli-helper.js';
import fs from 'node:fs';
import path from 'node:path';

describe('FR-003: Mote replenishment at tick 120', () => {
  const cleanups: string[] = [];

  afterEach(() => {
    for (const f of cleanups) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    cleanups.length = 0;
  });

  it('replenishes 1 mote at tick 120 when available < needed and random_motes is true', () => {
    const scenarioPath = path.resolve('temp_replenish_scenario.json');
    cleanups.push(scenarioPath);

    fs.writeFileSync(
      scenarioPath,
      JSON.stringify({
        random_motes: true,
        random_shades: false,
        motes: [],
        shades: [],
        player: { pos: [0, 0, 0], carried: 0 },
      })
    );

    // Run 119 ticks -> should have 0 motes active
    const res119 = runCliSync({
      seed: 42,
      night: 1,
      ticks: 119,
      snapshotEvery: 119,
      scenarioPath,
    });
    cleanups.push(res119.outputPath);
    expect(res119.status).toBe(0);
    const lines119 = res119.readLines<any>();
    const snap119 = lines119.find((l) => l.type === 'snapshot' && l.tick === 119);
    expect(snap119.motes_active).toBe(0);

    // Run 120 ticks -> tick 120 should replenish 1 mote -> motes_active = 1
    const res120 = runCliSync({
      seed: 42,
      night: 1,
      ticks: 120,
      snapshotEvery: 120,
      scenarioPath,
    });
    cleanups.push(res120.outputPath);
    expect(res120.status).toBe(0);
    const lines120 = res120.readLines<any>();
    const snap120 = lines120.find((l) => l.type === 'snapshot' && l.tick === 120);
    expect(snap120.motes_active).toBe(1);
  });

  it('never replenishes when random_motes is false', () => {
    const scenarioPath = path.resolve('temp_no_replenish_scenario.json');
    cleanups.push(scenarioPath);

    fs.writeFileSync(
      scenarioPath,
      JSON.stringify({
        random_motes: false,
        random_shades: false,
        motes: [],
        shades: [],
        player: { pos: [0, 0, 0], carried: 0 },
      })
    );

    const res = runCliSync({
      seed: 42,
      night: 1,
      ticks: 120,
      snapshotEvery: 120,
      scenarioPath,
    });
    cleanups.push(res.outputPath);
    expect(res.status).toBe(0);
    const lines = res.readLines<any>();
    const snap120 = lines.find((l) => l.type === 'snapshot' && l.tick === 120);
    expect(snap120.motes_active).toBe(0);
  });
});
