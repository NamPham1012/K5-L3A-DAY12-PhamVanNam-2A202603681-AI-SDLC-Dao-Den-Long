import { describe, it, expect, afterEach } from 'vitest';
import { runCliSync } from '../cli-helper.js';
import fs from 'node:fs';
import path from 'node:path';

describe('FR2-010 / FR2-012: Pickup height check, 0 score on pickup, +10 per mote on deposit & +100 on lit', () => {
  const cleanups: string[] = [];

  afterEach(() => {
    for (const f of cleanups) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    cleanups.length = 0;
  });

  it('FR2-012: awards 0 points on pickup, +10 per deposited mote, and +100 when lantern lights at 10', () => {
    const scenarioPath = path.resolve('temp_fr2_012_s.json');
    const inputsPath = path.resolve('temp_fr2_012_i.json');
    cleanups.push(scenarioPath, inputsPath);

    fs.writeFileSync(
      scenarioPath,
      JSON.stringify({
        player: { pos: [0, 0, 0], carried: 1, flames: 3 },
        random_motes: false,
        random_shades: false,
        motes: [
          [0.5, 0, 0], // XZ=0.5<=1, dy=0<=1.5 -> nhặt
          [0.5, 2.0, 0], // dy=2.0>1.5 -> không nhặt
        ],
        shades: [],
        lanterns: [{ id: 'L1', pos: [0, 0, 1.8], deposited: 8 }],
      })
    );
    fs.writeFileSync(
      inputsPath,
      JSON.stringify({
        frames: [{ tick: 1, interact: true }],
      })
    );

    const res = runCliSync({
      seed: 1,
      night: 1,
      ticks: 2,
      snapshotEvery: 1,
      scenarioPath,
      inputsPath,
    });
    cleanups.push(res.outputPath);
    expect(res.status).toBe(0);

    const lines = res.readLines<any>();
    // Tick 1: nhặt 1 mote (carried 1->2), điểm vẫn = 0!
    const snap1 = lines.find((l) => l.type === 'snapshot' && l.tick === 1);
    expect(snap1.player.carried).toBe(2);
    expect(snap1.motes_active).toBe(1);
    expect(snap1.score).toBe(0);

    // Tick 2: interact nạp 2 mote vào L1 (8->10) -> +20 nạp + 100 thắp = 120
    const snap2 = lines.find((l) => l.type === 'snapshot' && l.tick === 2);
    expect(snap2.player.carried).toBe(0);
    expect(snap2.score).toBe(120);
    expect(snap2.lanterns.find((l: any) => l.id === 'L1').lit).toBe(true);
  });
});
