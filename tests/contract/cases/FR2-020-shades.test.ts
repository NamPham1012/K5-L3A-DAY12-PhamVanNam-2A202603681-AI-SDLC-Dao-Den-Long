import { describe, it, expect, afterEach } from 'vitest';
import { runCliSync } from '../cli-helper.js';
import fs from 'node:fs';
import path from 'node:path';

describe('FR2-020 / FR2-021 / FR2-023: Shades spawn schedule, 5 states & safe radius', () => {
  const cleanups: string[] = [];

  afterEach(() => {
    for (const f of cleanups) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    cleanups.length = 0;
  });

  it('FR2-020: spawns 0 shades at tick 0, 2 shades at tick 300, +1 at tick 780 (300+480)', () => {
    const scenarioPath = path.resolve('temp_fr2_020_spawn_s.json');
    cleanups.push(scenarioPath);

    // Đứng ở đèn L1 đã thắp để an toàn tới tick 800
    fs.writeFileSync(
      scenarioPath,
      JSON.stringify({
        player: { pos: [0, 0, 25], flames: 3 },
        random_motes: false,
        random_shades: true,
        motes: [],
        lanterns: [{ id: 'L1', pos: [0, 0, 25], lit: true }],
      })
    );

    const res = runCliSync({
      seed: 42,
      night: 1,
      ticks: 800,
      snapshotEvery: 1,
      scenarioPath,
    });
    cleanups.push(res.outputPath);
    expect(res.status).toBe(0);

    const lines = res.readLines<any>();
    const snap0 = lines.find((l) => l.type === 'snapshot' && l.tick === 0);
    expect(snap0.shades).toHaveLength(0);

    const spawnEvents = lines.filter((l) => l.type === 'event' && l.name === 'shade_spawned');
    expect(spawnEvents).toHaveLength(3);
    expect(spawnEvents[0]).toMatchObject({ tick: 300, data: { id: 'S1' } });
    expect(spawnEvents[1]).toMatchObject({ tick: 300, data: { id: 'S2' } });
    expect(spawnEvents[2]).toMatchObject({ tick: 780, data: { id: 'S3' } });

    // Tại tick 300 shade mới ở trạng thái spawning; tick 301 chuyển sang wander
    const snap300 = lines.find((l) => l.type === 'snapshot' && l.tick === 300);
    expect(snap300.shades[0].state).toBe('spawning');
    const snap301 = lines.find((l) => l.type === 'snapshot' && l.tick === 301);
    expect(snap301.shades[0].state).toBe('wander');
  });

  it('FR2-021: shade detects player at <=12m (wander->chase) and drops chase at >18m', () => {
    const scenarioPath = path.resolve('temp_fr2_021_detect_s.json');
    cleanups.push(scenarioPath);

    fs.writeFileSync(
      scenarioPath,
      JSON.stringify({
        player: { pos: [0, 0, 0], flames: 3 },
        random_motes: false,
        random_shades: false,
        motes: [],
        shades: [
          { id: 'S1', pos: [11, 1, 0], state: 'wander' },
          { id: 'S2', pos: [20, 1, 0], state: 'chase' },
        ],
      })
    );

    const res = runCliSync({
      seed: 1,
      night: 1,
      ticks: 1,
      snapshotEvery: 1,
      scenarioPath,
    });
    cleanups.push(res.outputPath);
    expect(res.status).toBe(0);

    const lines = res.readLines<any>();
    const snap1 = lines.find((l) => l.type === 'snapshot' && l.tick === 1);
    expect(snap1.shades.find((s: any) => s.id === 'S1').state).toBe('chase');
    expect(snap1.shades.find((s: any) => s.id === 'S2').state).toBe('wander');
  });

  it('FR2-023: shade inside safe_radius when lantern lights is pushed out within 30 ticks without hitting player', () => {
    const scenarioPath = path.resolve('temp_fr2_023_safe_s.json');
    cleanups.push(scenarioPath);

    fs.writeFileSync(
      scenarioPath,
      JSON.stringify({
        player: { pos: [0, 0, 25], flames: 3 },
        random_motes: false,
        random_shades: false,
        motes: [],
        lanterns: [{ id: 'L1', pos: [0, 0, 25], lit: true }],
        shades: [{ id: 'S1', pos: [0, 1, 24.5], state: 'chase' }],
      })
    );

    const res = runCliSync({
      seed: 1,
      night: 1,
      ticks: 35,
      snapshotEvery: 5,
      scenarioPath,
    });
    cleanups.push(res.outputPath);
    expect(res.status).toBe(0);

    const lines = res.readLines<any>();
    // Không gây sát thương trong lúc bị đẩy ra
    const hits = lines.filter((l) => l.type === 'event' && l.name === 'player_hit');
    expect(hits).toHaveLength(0);

    // Sau 30 tick phải ở mép >= 6m
    const snap30 = lines.find((l) => l.type === 'snapshot' && l.tick === 30);
    const s1 = snap30.shades[0];
    const dist = Math.hypot(s1.pos[0] - 0, s1.pos[2] - 25);
    expect(dist).toBeGreaterThanOrEqual(5.99);
  });
});
