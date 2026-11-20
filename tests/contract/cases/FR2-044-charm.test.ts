import { describe, it, expect, afterEach } from 'vitest';
import { runCliSync } from '../cli-helper.js';
import fs from 'node:fs';
import path from 'node:path';

describe('FR2-044: Wind Charm pickup, 600-tick buff (7.2 m/s + zero dash cd) & 2700-tick respawn', () => {
  const cleanups: string[] = [];

  afterEach(() => {
    for (const f of cleanups) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    cleanups.length = 0;
  });

  it('FR2-044: picks C1 in Night 2, boosts speed to 7.2 m/s, allows instant re-dash after 12 ticks, respawns after 2700 ticks', () => {
    const scenarioPath = path.resolve('temp_fr2_044_charm_s.json');
    const inputsPath = path.resolve('temp_fr2_044_charm_i.json');
    cleanups.push(scenarioPath, inputsPath);

    // Đứng đúng vị trí bùa C1 (35, 0, 0) trên cầu tre Đêm 2
    fs.writeFileSync(
      scenarioPath,
      JSON.stringify({
        player: { pos: [35, 0, 0], carried: 10, flames: 3 }, // carried=10 đầy vẫn nhặt được bùa!
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
        frames: [
          { tick: 1, move: [1, 0] }, // chạy 1 tick với tốc độ 7.2 m/s -> dx = 0.12 m
          { tick: 2, move: [0, 0], dash: true }, // dash 1 (tick 3..14)
          { tick: 3, dash: false },
          { tick: 10, dash: true }, // đang lướt -> bỏ qua
          { tick: 11, dash: false },
          { tick: 14, dash: true }, // vừa hết 12 tick lướt -> lướt lại ngay không cooldown!
          { tick: 15, dash: false },
        ],
      })
    );

    const res = runCliSync({
      seed: 1,
      night: 2,
      ticks: 2705,
      snapshotEvery: 1,
      scenarioPath,
      inputsPath,
    });
    cleanups.push(res.outputPath);
    expect(res.status).toBe(0);

    const lines = res.readLines<any>();
    const charmEv = lines.find((l) => l.type === 'event' && l.name === 'charm_picked');
    expect(charmEv).toBeDefined();
    expect(charmEv.tick).toBe(1);
    expect(charmEv.data).toEqual({ charm_id: 'C1', charm_ticks: 600 });

    // Kiểm tra tốc độ chạy 7.2 m/s tại tick 2
    const snap1 = lines.find((l) => l.type === 'snapshot' && l.tick === 1);
    const snap2 = lines.find((l) => l.type === 'snapshot' && l.tick === 2);
    expect(snap1.player.charm_s).toBe(10); // 600/60 = 10s
    expect(snap2.player.pos[0] - snap1.player.pos[0]).toBeCloseTo(7.2 / 60, 3);

    // Kiểm tra 2 lần dash liên tiếp không cooldown (tick 3 và tick 15; tick 11 bị bỏ qua)
    const dashes = lines.filter((l) => l.type === 'event' && l.name === 'dash');
    expect(dashes).toHaveLength(2);
    expect(dashes[0].tick).toBe(3);
    expect(dashes[1].tick).toBe(15);

    // Hồi sinh bùa sau đúng 2700 tick (nhặt tick 1 -> tick 2700 chưa có, tick 2701 available=true)
    const snap2700 = lines.find((l) => l.type === 'snapshot' && l.tick === 2700);
    expect(snap2700.charms[0].available).toBe(false);
    const snap2701 = lines.find((l) => l.type === 'snapshot' && l.tick === 2701);
    expect(snap2701.charms[0].available).toBe(true);
  });
});
