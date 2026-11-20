import { describe, it, expect, afterEach } from 'vitest';
import { runCliSync } from '../cli-helper.js';
import fs from 'node:fs';
import path from 'node:path';

describe('FR2-024: Pulse 3D radius from foot+0.8, 15-tick push 4m, 120-tick stun refresh, +5 score', () => {
  const cleanups: string[] = [];

  afterEach(() => {
    for (const f of cleanups) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    cleanups.length = 0;
  });

  it('FR2-024: checks 3D distance from (0,0.8,0), pushes 4m over 15 ticks, +5 per shade even if already stunned', () => {
    const scenarioPath = path.resolve('temp_fr2_024_pulse_s.json');
    const inputsPath = path.resolve('temp_fr2_024_pulse_i.json');
    cleanups.push(scenarioPath, inputsPath);

    // Tâm pulse = (0, 0.8, 0), bán kính 3D = 5.0m:
    // S1 ở (0, 0.8, 0) -> dist 0 <= 5 -> trúng, trùng vị trí nên đẩy theo +X (tổng 4m sau 15 tick)
    // S2 ở (3, 4.8, 0) -> dx=3, dy=4 -> dist 3D = 5.0 <= 5 -> trúng (đang stunned vẫn +5 và làm mới)
    // S3 ở (4, 4.8, 0) -> dx=4, dy=4 -> dist 3D = sqrt(32) = 5.66 > 5 -> không trúng (dù XZ=4 <= 5)
    fs.writeFileSync(
      scenarioPath,
      JSON.stringify({
        player: { pos: [0, 0, 0], carried: 5, flames: 3 },
        random_motes: false,
        random_shades: false,
        motes: [],
        shades: [
          { id: 'S1', pos: [0, 0.8, 0], state: 'chase' },
          { id: 'S2', pos: [3, 4.8, 0], state: 'stunned', state_ticks_left: 20 },
          { id: 'S3', pos: [4, 4.8, 0], state: 'wander' },
        ],
      })
    );
    fs.writeFileSync(
      inputsPath,
      JSON.stringify({
        frames: [{ tick: 0, pulse: true }],
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
    const pulseEv = lines.find((l) => l.type === 'event' && l.name === 'pulse');
    expect(pulseEv).toBeDefined();
    expect(pulseEv.tick).toBe(1);
    expect(pulseEv.data).toEqual({ stunned_ids: ['S1', 'S2'] });

    // Điểm = 5 * 2 = 10; carried = 5 - 3 = 2; cooldown = 3.0s
    const snap1 = lines.find((l) => l.type === 'snapshot' && l.tick === 1);
    expect(snap1.score).toBe(10);
    expect(snap1.player.carried).toBe(2);
    expect(snap1.player.pulse_cd_s).toBe(3);

    // Sau 15 tick (tick 15), S1 đã bị đẩy đủ 4m theo +X
    const snap15 = lines.find((l) => l.type === 'snapshot' && l.tick === 15);
    const s1At15 = snap15.shades.find((s: any) => s.id === 'S1');
    expect(s1At15.pos[0]).toBeCloseTo(4.0, 2);
    expect(s1At15.pos[2]).toBeCloseTo(0, 2);
  });
});
