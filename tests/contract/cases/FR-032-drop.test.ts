import { describe, it, expect, afterEach } from 'vitest';
import { runCliSync } from '../cli-helper.js';
import fs from 'node:fs';
import path from 'node:path';

describe('FR-032: Dropped motes on hit', () => {
  const cleanups: string[] = [];

  afterEach(() => {
    for (const f of cleanups) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    cleanups.length = 0;
  });

  it('drops floor(carried * hit_drop_ratio) motes in a 3m circle around player on hit', () => {
    const scenarioPath = path.resolve('temp_drop_scenario.json');
    cleanups.push(scenarioPath);

    // Carried: 6, flames: 3 -> dropped = floor(6 * 0.5) = 3
    fs.writeFileSync(
      scenarioPath,
      JSON.stringify({
        player: { pos: [0, 0, 0], carried: 6, flames: 3 },
        random_motes: false,
        random_shades: false,
        motes: [],
        shades: [{ id: 'S1', pos: [0, 0, 0] }],
      })
    );

    const res = runCliSync({
      seed: 42,
      night: 1,
      ticks: 1,
      snapshotEvery: 1,
      scenarioPath,
    });
    cleanups.push(res.outputPath);

    expect(res.status).toBe(0);
    const lines = res.readLines<any>();

    const hit = lines.find((l) => l.type === 'event' && l.name === 'player_hit');
    expect(hit).toBeDefined();
    expect(hit.data.dropped).toBe(3);
    expect(hit.data.flames).toBe(2);

    const snap1 = lines.find((l) => l.type === 'snapshot' && l.tick === 1);
    expect(snap1.player.carried).toBe(3);
    expect(snap1.motes_active).toBe(3);
  });
});
