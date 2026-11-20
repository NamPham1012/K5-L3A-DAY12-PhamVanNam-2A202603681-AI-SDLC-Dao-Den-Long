import { describe, it, expect, afterEach } from 'vitest';
import { runCliSync } from '../cli-helper.js';
import fs from 'node:fs';
import path from 'node:path';

describe('FR-004: Shade initial count and spawning schedule at tick 1800', () => {
  const cleanups: string[] = [];

  afterEach(() => {
    for (const f of cleanups) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    cleanups.length = 0;
  });

  it('starts with 0 shades at tick 0 and spawns 2 shades at tick 300 (Phase 2 Ticket-02)', () => {
    const res = runCliSync({
      seed: 42,
      night: 1,
      ticks: 300,
      snapshotEvery: 300,
    });
    cleanups.push(res.outputPath);

    expect(res.status).toBe(0);
    const lines = res.readLines<any>();

    const snap0 = lines.find((l) => l.type === 'snapshot' && l.tick === 0);
    expect(snap0.shades).toHaveLength(0);

    const spawnEvents = lines.filter((l) => l.type === 'event' && l.name === 'shade_spawned');
    expect(spawnEvents).toHaveLength(2);
    expect(spawnEvents[0].tick).toBe(300);
    expect(spawnEvents[0].data.id).toBe('S1');
    expect(spawnEvents[1].tick).toBe(300);
    expect(spawnEvents[1].data.id).toBe('S2');
  });

  it('spawns shades on 300 + 480k schedule up to max 6 (Phase 2 Ticket-02)', () => {
    const scenarioPath = path.resolve('temp_spawn1800_scenario.json');
    cleanups.push(scenarioPath);

    // Place player near a lit lantern so shades cannot reach due to safe_radius
    fs.writeFileSync(
      scenarioPath,
      JSON.stringify({
        player: { pos: [0, 0, 25], flames: 10 },
        random_shades: true,
        random_motes: false,
        motes: [],
        lanterns: [{ id: 'L1', pos: [0, 0, 25], lit: true }],
        shades: [{ id: 'S1', pos: [37, 1, 0] }],
        time_left_s: 300,
      })
    );

    // Tại tick 300 (+2: S2, S3), 780 (+1: S4), 1260 (+1: S5), 1740 (+1: S6 -> đạt tối đa 6)
    const res = runCliSync({
      seed: 42,
      night: 1,
      ticks: 2300,
      snapshotEvery: 2300,
      scenarioPath,
    });
    cleanups.push(res.outputPath);

    expect(res.status).toBe(0);
    const lines = res.readLines<any>();

    const spawnEvents = lines.filter((l) => l.type === 'event' && l.name === 'shade_spawned');
    expect(spawnEvents).toHaveLength(5);
    expect(spawnEvents[0].tick).toBe(300);
    expect(spawnEvents[0].data.id).toBe('S2');

    const snapEnd = lines.find((l) => l.type === 'snapshot' && l.tick === 2300);
    expect(snapEnd.shades.length).toBe(6);
  });
});
