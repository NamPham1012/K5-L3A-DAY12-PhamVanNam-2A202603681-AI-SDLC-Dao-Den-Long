import { describe, it, expect, afterEach } from 'vitest';
import { runCliSync } from '../cli-helper.js';
import fs from 'node:fs';
import path from 'node:path';

describe('FR2-040 / FR2-041 / FR2-042: Drifter spawn, chase, steal before shade, flee & removed', () => {
  const cleanups: string[] = [];

  afterEach(() => {
    for (const f of cleanups) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    cleanups.length = 0;
  });

  it('FR2-040 / FR2-042: steals min(3, carried) ignoring invuln & safe_radius, flees 240 ticks then removed', () => {
    const scenarioPath = path.resolve('temp_fr2_040_steal_s.json');
    cleanups.push(scenarioPath);

    // Player bất tử, đứng trong safe_radius của L1 đã thắp, mang 6 đom đóm
    // Drifter D1 ở ngay cạnh -> cướp 3, không mất lửa, chuyển flee 240 tick rồi removed
    fs.writeFileSync(
      scenarioPath,
      JSON.stringify({
        player: { pos: [0, 0, 20], carried: 6, flames: 3, invuln_ticks: 90 },
        random_motes: false,
        random_shades: false,
        random_drifters: false,
        motes: [],
        shades: [],
        lanterns: [{ id: 'L1', pos: [0, 0, 20], lit: true }],
        drifters: [{ id: 'D1', pos: [0.5, 1.5, 20], state: 'idle' }],
      })
    );

    const res = runCliSync({
      seed: 1,
      night: 2,
      ticks: 245,
      snapshotEvery: 1,
      scenarioPath,
    });
    cleanups.push(res.outputPath);
    expect(res.status).toBe(0);

    const lines = res.readLines<any>();
    const stealEv = lines.find((l) => l.type === 'event' && l.name === 'drifter_steal');
    expect(stealEv).toBeDefined();
    expect(stealEv.tick).toBe(1);
    expect(stealEv.data).toEqual({ drifter_id: 'D1', amount: 3, carried: 3 });

    const snap1 = lines.find((l) => l.type === 'snapshot' && l.tick === 1);
    expect(snap1.player.flames).toBe(3); // không làm mất lửa
    expect(snap1.player.carried).toBe(3);
    expect(snap1.drifters[0]).toMatchObject({ id: 'D1', state: 'flee', stolen: 3 });

    // Sau 240 tick flee (tick 241): chuyển removed và vẫn có mặt trong snapshot
    const snap241 = lines.find((l) => l.type === 'snapshot' && l.tick === 241);
    expect(snap241.drifters[0].state).toBe('removed');
  });

  it('FR2-040: spawns drifter at tick 1200 and caps active drifters at 2 in Night 2', () => {
    const scenarioPath = path.resolve('temp_fr2_040_spawn_s.json');
    cleanups.push(scenarioPath);

    fs.writeFileSync(
      scenarioPath,
      JSON.stringify({
        player: { pos: [0, 0, 0], carried: 0, flames: 3 },
        random_motes: false,
        random_shades: false,
        random_drifters: true,
        motes: [],
        shades: [],
      })
    );

    const res = runCliSync({
      seed: 1,
      night: 2,
      ticks: 3700,
      snapshotEvery: 1200,
      scenarioPath,
    });
    cleanups.push(res.outputPath);
    expect(res.status).toBe(0);

    const lines = res.readLines<any>();
    const snap1200 = lines.find((l) => l.type === 'snapshot' && l.tick === 1200);
    expect(snap1200.drifters).toHaveLength(1);
    expect(snap1200.drifters[0].id).toBe('D1');

    const snap2400 = lines.find((l) => l.type === 'snapshot' && l.tick === 2400);
    expect(snap2400.drifters).toHaveLength(2);

    const snap3600 = lines.find((l) => l.type === 'snapshot' && l.tick === 3600);
    expect(snap3600.drifters).toHaveLength(2); // tối đa 2 con hoạt động
  });
});
