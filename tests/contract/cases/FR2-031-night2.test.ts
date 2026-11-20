import { describe, it, expect, afterEach } from 'vitest';
import { runCliSync } from '../cli-helper.js';
import fs from 'node:fs';
import path from 'node:path';

describe('FR2-031: Night 2 (Dao Cau) — two islands, bamboo bridge, jump pads & 6 lanterns', () => {
  const cleanups: string[] = [];

  afterEach(() => {
    for (const f of cleanups) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    cleanups.length = 0;
  });

  it('FR2-031: initializes 6 lanterns, C1 charm, bamboo bridge walkable & off-bridge falls', () => {
    const scenarioPath = path.resolve('temp_fr2_031_bridge_s.json');
    const inputsPath = path.resolve('temp_fr2_031_bridge_i.json');
    cleanups.push(scenarioPath, inputsPath);

    // Đứng trên cầu tre tại (35, 0, 0), đi sang +Z vượt z=2 sẽ rơi xuống biển mây
    fs.writeFileSync(
      scenarioPath,
      JSON.stringify({
        player: { pos: [35, 0, 0], flames: 3, carried: 0 },
        random_motes: false,
        random_shades: false,
        random_drifters: false,
        motes: [],
        shades: [],
      })
    );
    fs.writeFileSync(
      inputsPath,
      JSON.stringify({
        frames: [{ tick: 0, move: [0, 1] }], // đi về +Z khỏi cầu (z > 2)
      })
    );

    const res = runCliSync({
      seed: 1,
      night: 2,
      ticks: 100,
      snapshotEvery: 10,
      scenarioPath,
      inputsPath,
    });
    cleanups.push(res.outputPath);
    expect(res.status).toBe(0);

    const lines = res.readLines<any>();
    const snap0 = lines.find((l) => l.type === 'snapshot' && l.tick === 0);
    expect(snap0.night).toBe(2);
    expect(snap0.time_left_s).toBe(330);
    expect(snap0.lanterns).toHaveLength(6);
    expect(snap0.lanterns[3]).toMatchObject({ id: 'L4', pos: [70, 0, 20] });
    expect(snap0.charms).toHaveLength(1);
    expect(snap0.charms[0].id).toBe('C1');

    // Bước khỏi cầu tre -> rơi Y < -10
    const fallHit = lines.find((l) => l.type === 'event' && l.name === 'player_hit');
    expect(fallHit).toBeDefined();
    expect(fallHit.data.by).toBe('fall');
  });

  it('FR2-031: jump pad at (20,0,18) launches player to Island B ignoring move input until landing', () => {
    const scenarioPath = path.resolve('temp_fr2_031_pad_s.json');
    const inputsPath = path.resolve('temp_fr2_031_pad_i.json');
    cleanups.push(scenarioPath, inputsPath);

    // Đứng đúng bục nhảy (20,0,18), giữ phím đi ngược [-1, 0] để kiểm tra move không ghi đè launch_vel
    fs.writeFileSync(
      scenarioPath,
      JSON.stringify({
        player: { pos: [20, 0, 18], flames: 3, carried: 0 },
        random_motes: false,
        random_shades: false,
        random_drifters: false,
        motes: [],
        shades: [],
      })
    );
    fs.writeFileSync(
      inputsPath,
      JSON.stringify({
        frames: [{ tick: 1, move: [-1, 0] }],
      })
    );

    const res = runCliSync({
      seed: 1,
      night: 2,
      ticks: 95,
      snapshotEvery: 1,
      scenarioPath,
      inputsPath,
    });
    cleanups.push(res.outputPath);
    expect(res.status).toBe(0);

    const lines = res.readLines<any>();
    const snap1 = lines.find((l) => l.type === 'snapshot' && l.tick === 1);
    expect(snap1.player.vel[1]).toBe(14);
    expect(snap1.player.grounded).toBe(false);

    // Sau ~1.4s (tick 85) đã đáp an toàn trên đảo B (tâm (70,0), bán kính 28)
    const snap86 = lines.find((l) => l.type === 'snapshot' && l.tick === 86);
    expect(snap86.player.grounded).toBe(true);
    const distToB = Math.hypot(snap86.player.pos[0] - 70, snap86.player.pos[2]);
    expect(distToB).toBeLessThan(28);
  });
});
