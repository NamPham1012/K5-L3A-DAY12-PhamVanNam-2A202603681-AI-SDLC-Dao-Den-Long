import { describe, it, expect, afterEach } from 'vitest';
import { runCliSync } from '../cli-helper.js';
import fs from 'node:fs';
import path from 'node:path';

describe('FR2-002: Pause & Resume freezes sim_tick, timers, cooldowns, TTL & spawns', () => {
  const cleanups: string[] = [];

  afterEach(() => {
    for (const f of cleanups) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    cleanups.length = 0;
  });

  it('FR2-002: increments tick while freezing sim_tick and timers during pause, then resumes cleanly', () => {
    const scenarioPath = path.resolve('temp_fr2_002_pause_s.json');
    const inputsPath = path.resolve('temp_fr2_002_pause_i.json');
    cleanups.push(scenarioPath, inputsPath);

    fs.writeFileSync(
      scenarioPath,
      JSON.stringify({
        player: { pos: [0, 0, 0], dash_cd_ticks: 60, flames: 3 },
        random_motes: false,
        random_shades: false,
        motes: [],
        shades: [],
      })
    );
    fs.writeFileSync(
      inputsPath,
      JSON.stringify({
        frames: [
          { tick: 0, move: [1, 0] }, // chạy 5 tick (tick 1..5)
          { tick: 5, pause: true }, // bước k=5 -> tick 6 vào pause ngay sau bước đọc input
          { tick: 6, pause: false }, // vẫn pause ở tick 7..15
          { tick: 15, pause: true }, // bước k=15 -> tick 16 resume và chạy bước mô phỏng thứ 6
          { tick: 16, pause: false },
        ],
      })
    );

    const res = runCliSync({
      seed: 1,
      night: 1,
      ticks: 20,
      snapshotEvery: 1,
      scenarioPath,
      inputsPath,
    });
    cleanups.push(res.outputPath);
    expect(res.status).toBe(0);

    const lines = res.readLines<any>();
    const pausedEv = lines.find((l) => l.type === 'event' && l.name === 'paused');
    const resumedEv = lines.find((l) => l.type === 'event' && l.name === 'resumed');
    expect(pausedEv).toEqual({ type: 'event', tick: 6, name: 'paused', data: {} });
    expect(resumedEv).toEqual({ type: 'event', tick: 16, name: 'resumed', data: {} });

    const snap5 = lines.find((l) => l.type === 'snapshot' && l.tick === 5);
    const snap6 = lines.find((l) => l.type === 'snapshot' && l.tick === 6);
    const snap15 = lines.find((l) => l.type === 'snapshot' && l.tick === 15);
    const snap16 = lines.find((l) => l.type === 'snapshot' && l.tick === 16);

    // Trong pause (tick 6..15): tick tăng, sim_tick đứng yên ở 5, thời gian & cooldown & pos đứng yên
    expect(snap6.state).toBe('paused');
    expect(snap6.sim_tick).toBe(5);
    expect(snap15.state).toBe('paused');
    expect(snap15.sim_tick).toBe(5);
    expect(snap15.time_left_s).toBe(snap5.time_left_s);
    expect(snap15.player.dash_cd_s).toBe(snap5.player.dash_cd_s);
    expect(snap15.player.pos).toEqual(snap5.player.pos);

    // Tại tick 16: resumed -> state playing, sim_tick tăng lên 6
    expect(snap16.state).toBe('playing');
    expect(snap16.sim_tick).toBe(6);
    expect(snap16.player.pos[0]).toBeGreaterThan(snap5.player.pos[0]);
  });
});
