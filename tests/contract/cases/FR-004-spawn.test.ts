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

  it('starts with 2 shades by default without spawn event', () => {
    const res = runCliSync({
      seed: 42,
      night: 1,
      ticks: 1,
      snapshotEvery: 1,
    });
    cleanups.push(res.outputPath);

    expect(res.status).toBe(0);
    const lines = res.readLines<any>();

    const snap0 = lines[0];
    expect(snap0.shades).toHaveLength(2);
    expect(snap0.shades[0].id).toBe('S1');
    expect(snap0.shades[1].id).toBe('S2');

    // No shade_spawned event for initial shades
    const spawnEvents = lines.filter((l) => l.type === 'event' && l.name === 'shade_spawned');
    expect(spawnEvents).toHaveLength(0);
  });

  it('spawns a new shade with shade_spawned event at tick 1800', () => {
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
        shades: [{ id: 'S1', pos: [38, 1, 0] }],
        time_left_s: 300,
      })
    );

    const res = runCliSync({
      seed: 42,
      night: 1,
      ticks: 1800,
      snapshotEvery: 1800,
      scenarioPath,
    });
    cleanups.push(res.outputPath);

    expect(res.status).toBe(0);
    const lines = res.readLines<any>();

    const spawnEvents = lines.filter((l) => l.type === 'event' && l.name === 'shade_spawned');
    expect(spawnEvents).toHaveLength(1);
    expect(spawnEvents[0].tick).toBe(1800);
    expect(spawnEvents[0].data.id).toBe('S2');

    const snap1800 = lines.find((l) => l.type === 'snapshot' && l.tick === 1800);
    expect(snap1800.shades.length).toBe(2);
  });
});
