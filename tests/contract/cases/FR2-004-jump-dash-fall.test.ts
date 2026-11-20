import { describe, it, expect, afterEach } from 'vitest';
import { runCliSync } from '../cli-helper.js';
import fs from 'node:fs';
import path from 'node:path';

describe('FR2-004 / FR2-005 / FR2-006: Jump, Dash and Fall/Respawn physics', () => {
  const cleanups: string[] = [];

  afterEach(() => {
    for (const f of cleanups) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    cleanups.length = 0;
  });

  it('FR2-004: jumps only when grounded with vy=7.0 and gravity -20 m/s^2', () => {
    const scenarioPath = path.resolve('temp_fr2_004_jump_s.json');
    const inputsPath = path.resolve('temp_fr2_004_jump_i.json');
    cleanups.push(scenarioPath, inputsPath);

    fs.writeFileSync(
      scenarioPath,
      JSON.stringify({
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
          { tick: 0, jump: true },
          { tick: 1, jump: false },
          { tick: 2, jump: true }, // đang trên không -> bỏ qua
        ],
      })
    );

    const res = runCliSync({
      seed: 1,
      night: 1,
      ticks: 60,
      snapshotEvery: 1,
      scenarioPath,
      inputsPath,
    });
    cleanups.push(res.outputPath);
    expect(res.status).toBe(0);

    const lines = res.readLines<any>();
    const snap1 = lines.find((l) => l.type === 'snapshot' && l.tick === 1);
    // Euler bán ẩn: vy = 7 - 20/60 = 6.667, y = vy/60 = 0.111
    expect(snap1.player.grounded).toBe(false);
    expect(snap1.player.vel[1]).toBeCloseTo(7 - 20 / 60, 2);
    expect(snap1.player.pos[1]).toBeGreaterThan(0.1);

    // Sau ~42 tick (2*7/20 = 0.7s) phải chạm đất lại
    const snap50 = lines.find((l) => l.type === 'snapshot' && l.tick === 50);
    expect(snap50.player.grounded).toBe(true);
    expect(snap50.player.pos[1]).toBe(0);
    expect(snap50.player.vel[1]).toBe(0);
  });

  it('FR2-005: dash moves at 14 m/s for 12 ticks, holds height in air, and has 90-tick cooldown', () => {
    const scenarioPath = path.resolve('temp_fr2_005_dash_s.json');
    const inputsPath = path.resolve('temp_fr2_005_dash_i.json');
    cleanups.push(scenarioPath, inputsPath);

    fs.writeFileSync(
      scenarioPath,
      JSON.stringify({
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
          { tick: 0, jump: true },
          { tick: 1, jump: false },
          { tick: 5, dash: true }, // lướt trên không theo hướng facing (+Z)
          { tick: 6, dash: false },
          { tick: 20, dash: true }, // còn cooldown -> không kích hoạt
          { tick: 21, dash: false },
          { tick: 95, dash: true }, // sau đúng 90 tick kể từ tick 5 -> kích hoạt lại
        ],
      })
    );

    const res = runCliSync({
      seed: 1,
      night: 1,
      ticks: 100,
      snapshotEvery: 1,
      scenarioPath,
      inputsPath,
    });
    cleanups.push(res.outputPath);
    expect(res.status).toBe(0);

    const lines = res.readLines<any>();
    const dashEvents = lines.filter((l) => l.type === 'event' && l.name === 'dash');
    expect(dashEvents).toHaveLength(2);
    expect(dashEvents[0].tick).toBe(6);
    expect(dashEvents[1].tick).toBe(96);

    // Trong 12 tick dash (tick 6..17), giữ nguyên độ cao Y và tiến 14 * 0.2 = 2.8m theo +Z
    const snap5 = lines.find((l) => l.type === 'snapshot' && l.tick === 5);
    const snap6 = lines.find((l) => l.type === 'snapshot' && l.tick === 6);
    const snap17 = lines.find((l) => l.type === 'snapshot' && l.tick === 17);
    expect(snap6.player.pos[1]).toBe(snap5.player.pos[1]);
    expect(snap17.player.pos[1]).toBe(snap5.player.pos[1]);
    expect(snap17.player.pos[2]).toBeCloseTo(2.8, 2);
  });

  it('FR2-006: falling below Y=-10 ignores invuln, loses carried, waits 60 ticks then respawns with 90 ticks invuln', () => {
    const scenarioPath = path.resolve('temp_fr2_006_fall_s.json');
    cleanups.push(scenarioPath);

    // Đặt player ngay ngoài mép đảo ở y = -9.9 với invuln_ticks = 90
    fs.writeFileSync(
      scenarioPath,
      JSON.stringify({
        player: { pos: [45, -9.9, 0], flames: 2, carried: 5, invuln_ticks: 90 },
        random_motes: false,
        random_shades: false,
        motes: [],
        shades: [],
      })
    );

    const res = runCliSync({
      seed: 1,
      night: 1,
      ticks: 80,
      snapshotEvery: 1,
      scenarioPath,
    });
    cleanups.push(res.outputPath);
    expect(res.status).toBe(0);

    const lines = res.readLines<any>();
    const fallHits = lines.filter((l) => l.type === 'event' && l.name === 'player_hit');
    expect(fallHits).toHaveLength(1);
    expect(fallHits[0].data).toEqual({ by: 'fall', flames: 1, dropped: 0, lost: 5 });

    const fallTick = fallHits[0].tick;
    // Sau đúng 60 tick chờ hồi sinh -> về (0,0,0), bất tử 90 tick (1.5s)
    const respawnSnap = lines.find((l) => l.type === 'snapshot' && l.tick === fallTick + 60);
    expect(respawnSnap.player.pos).toEqual([0, 0, 0]);
    expect(respawnSnap.player.vel).toEqual([0, 0, 0]);
    expect(respawnSnap.player.invuln).toBe(1.5);
  });

  it('FR2-006: falling with 1 flame left ends game immediately with no_flames', () => {
    const scenarioPath = path.resolve('temp_fr2_006_fall_die_s.json');
    cleanups.push(scenarioPath);

    fs.writeFileSync(
      scenarioPath,
      JSON.stringify({
        player: { pos: [45, -9.9, 0], flames: 1, carried: 3 },
        random_motes: false,
        random_shades: false,
        motes: [],
        shades: [],
      })
    );

    const res = runCliSync({
      seed: 1,
      night: 1,
      ticks: 30,
      snapshotEvery: 1,
      scenarioPath,
    });
    cleanups.push(res.outputPath);
    expect(res.status).toBe(0);

    const lines = res.readLines<any>();
    const gameOver = lines.find((l) => l.type === 'event' && l.name === 'game_over');
    expect(gameOver).toBeDefined();
    expect(gameOver.data).toEqual({ result: 'lost', reason: 'no_flames' });

    const end = lines[lines.length - 1];
    expect(end.state).toBe('lost');
    expect(end.ticks).toBe(gameOver.tick);
  });
});
