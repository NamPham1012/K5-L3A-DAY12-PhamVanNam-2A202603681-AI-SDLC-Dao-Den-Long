import { describe, it, expect, afterEach } from 'vitest';
import { runCliSync } from '../cli-helper.js';
import fs from 'node:fs';
import path from 'node:path';

describe('FR2-033: Night 3 strong wind every 1800 ticks for 300 ticks at 2 m/s', () => {
  const cleanups: string[] = [];

  afterEach(() => {
    for (const f of cleanups) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    cleanups.length = 0;
  });

  it('FR2-033: activates wind at tick 1800, pushes player 2 m/s for 300 ticks, stops at tick 2100', () => {
    const scenarioPath = path.resolve('temp_fr2_033_wind_s.json');
    cleanups.push(scenarioPath);

    fs.writeFileSync(
      scenarioPath,
      JSON.stringify({
        player: { pos: [0, 0, -30], flames: 3 },
        random_motes: false,
        random_shades: false,
        random_drifters: false,
        wind_enabled: true,
        motes: [],
        shades: [],
      })
    );

    const res = runCliSync({
      seed: 99,
      night: 3,
      ticks: 2110,
      snapshotEvery: 10,
      scenarioPath,
    });
    cleanups.push(res.outputPath);
    expect(res.status).toBe(0);

    const lines = res.readLines<any>();
    const snap1790 = lines.find((l) => l.type === 'snapshot' && l.tick === 1790);
    expect(snap1790.wind.active).toBe(false);
    expect(snap1790.player.pos).toEqual([0, 0, -30]);

    const snap1800 = lines.find((l) => l.type === 'snapshot' && l.tick === 1800);
    expect(snap1800.wind.active).toBe(true);
    expect(snap1800.wind.dir_deg).toBeGreaterThanOrEqual(0);
    expect(snap1800.wind.dir_deg).toBeLessThan(360);

    // Sau 60 tick có gió (1s), người chơi phải dịch chuyển 2m theo hướng gió
    const snap1860 = lines.find((l) => l.type === 'snapshot' && l.tick === 1860);
    const moved = Math.hypot(
      snap1860.player.pos[0] - snap1790.player.pos[0],
      snap1860.player.pos[2] - snap1790.player.pos[2]
    );
    expect(moved).toBeGreaterThan(1.9);

    // Tại tick 2100 (sau đúng 300 tick gió): gió tắt
    const snap2100 = lines.find((l) => l.type === 'snapshot' && l.tick === 2100);
    expect(snap2100.wind.active).toBe(false);
  });
});
