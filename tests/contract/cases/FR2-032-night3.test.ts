import { describe, it, expect, afterEach } from 'vitest';
import { runCliSync } from '../cli-helper.js';
import fs from 'node:fs';
import path from 'node:path';

describe('FR2-032: Night 3 (Dao Chuong) — 3 tiers, walls, ramps 30/150 deg, jump pad & tower', () => {
  const cleanups: string[] = [];

  afterEach(() => {
    for (const f of cleanups) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    cleanups.length = 0;
  });

  it('FR2-032: blocks walking into Tier 1 cliff wall and bell tower r=2', () => {
    const scenarioPath = path.resolve('temp_fr2_032_wall_s.json');
    const inputsPath = path.resolve('temp_fr2_032_wall_i.json');
    cleanups.push(scenarioPath, inputsPath);

    // Đứng ngay ngoài vách tầng 1 ở (0, 0, 24.5), đi về -Z (vào r=24) -> phải bị vách chặn
    fs.writeFileSync(
      scenarioPath,
      JSON.stringify({
        player: { pos: [0, 0, 24.5], flames: 3 },
        random_motes: false,
        random_shades: false,
        random_drifters: false,
        wind_enabled: false,
        motes: [],
        shades: [],
      })
    );
    fs.writeFileSync(
      inputsPath,
      JSON.stringify({
        frames: [{ tick: 0, move: [0, -1] }],
      })
    );

    const res = runCliSync({
      seed: 1,
      night: 3,
      ticks: 15,
      snapshotEvery: 15,
      scenarioPath,
      inputsPath,
    });
    cleanups.push(res.outputPath);
    expect(res.status).toBe(0);

    const lines = res.readLines<any>();
    const snap0 = lines.find((l) => l.type === 'snapshot' && l.tick === 0);
    expect(snap0.lanterns).toHaveLength(7);
    expect(snap0.charms).toHaveLength(2);

    const snap15 = lines.find((l) => l.type === 'snapshot' && l.tick === 15);
    expect(snap15.player.pos[1]).toBe(0);
    expect(snap15.player.pos[2]).toBeGreaterThanOrEqual(24);
  });

  it('FR2-032: climbs 30 deg ramp from r=30 (Y=0) up to Tier 1 (Y=3) and uses jump pad (0,3,13) to reach Tier 2 (Y=6)', () => {
    const rampScenario = path.resolve('temp_fr2_032_ramp_s.json');
    const rampInputs = path.resolve('temp_fr2_032_ramp_i.json');
    const padScenario = path.resolve('temp_fr2_032_pad_s.json');
    cleanups.push(rampScenario, rampInputs, padScenario);

    // 1) Leo dốc 30° từ chân dốc r=30 vào r=23 (lên tầng 1 Y=3)
    const rad30 = (30 * Math.PI) / 180;
    const ux = Math.cos(rad30);
    const uz = Math.sin(rad30);

    fs.writeFileSync(
      rampScenario,
      JSON.stringify({
        player: { pos: [30 * ux, 0, 30 * uz], flames: 3 },
        random_motes: false,
        random_shades: false,
        random_drifters: false,
        wind_enabled: false,
        motes: [],
        shades: [],
      })
    );
    // Đi ngược hướng bán kính (-ux, -uz) để đi từ r=30 vào r=23
    fs.writeFileSync(
      rampInputs,
      JSON.stringify({
        frames: [{ tick: 0, move: [-ux, -uz] }],
      })
    );

    const resRamp = runCliSync({
      seed: 1,
      night: 3,
      ticks: 80,
      snapshotEvery: 80,
      scenarioPath: rampScenario,
      inputsPath: rampInputs,
    });
    cleanups.push(resRamp.outputPath);
    expect(resRamp.status).toBe(0);
    const snapRamp = resRamp.readLines<any>().find((l) => l.type === 'snapshot' && l.tick === 80);
    expect(snapRamp.player.pos[1]).toBe(3);

    // 2) Bục nhảy (0,3,13) bắn vy=12 + ngang 8 hướng -Z đáp lên tầng 2 (Y=6)
    fs.writeFileSync(
      padScenario,
      JSON.stringify({
        player: { pos: [0, 3, 13], flames: 3 },
        random_motes: false,
        random_shades: false,
        random_drifters: false,
        wind_enabled: false,
        motes: [],
        shades: [],
      })
    );

    const resPad = runCliSync({
      seed: 1,
      night: 3,
      ticks: 60,
      snapshotEvery: 1,
      scenarioPath: padScenario,
    });
    cleanups.push(resPad.outputPath);
    expect(resPad.status).toBe(0);
    const snap60 = resPad.readLines<any>().find((l) => l.type === 'snapshot' && l.tick === 60);
    expect(snap60.player.grounded).toBe(true);
    expect(snap60.player.pos[1]).toBe(6);
    expect(Math.hypot(snap60.player.pos[0], snap60.player.pos[2])).toBeLessThanOrEqual(8);
  });
});
