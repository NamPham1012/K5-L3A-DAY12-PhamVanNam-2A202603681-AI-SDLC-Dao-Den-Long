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

  it('replenishes 1 mote at tick 240 (Phase 2 Ticket-02 schedule) when random motes < 30 and random_motes is true', () => {
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

    // Phase 2 Ticket-02: sinh thêm 1 đom đóm tại các tick 240, 480, ...
    const res239 = runCliSync({
      seed: 42,
      night: 1,
      ticks: 239,
      snapshotEvery: 239,
      scenarioPath,
    });
    cleanups.push(res239.outputPath);
    expect(res239.status).toBe(0);
    const lines239 = res239.readLines<any>();
    const snap239 = lines239.find((l) => l.type === 'snapshot' && l.tick === 239);
    expect(snap239.motes_active).toBe(0);

    const res240 = runCliSync({
      seed: 42,
      night: 1,
      ticks: 240,
      snapshotEvery: 240,
      scenarioPath,
    });
    cleanups.push(res240.outputPath);
    expect(res240.status).toBe(0);
    const lines240 = res240.readLines<any>();
    const snap240 = lines240.find((l) => l.type === 'snapshot' && l.tick === 240);
    expect(snap240.motes_active).toBe(1);
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
