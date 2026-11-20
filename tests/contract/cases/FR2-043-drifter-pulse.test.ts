import { describe, it, expect, afterEach } from 'vitest';
import { runCliSync } from '../cli-helper.js';
import fs from 'node:fs';
import path from 'node:path';

describe('FR2-043: Pulse hitting Drifter in chase vs flee with stolen motes', () => {
  const cleanups: string[] = [];

  afterEach(() => {
    for (const f of cleanups) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    cleanups.length = 0;
  });

  it('FR2-043: pulse turns chasing drifter to flee, and makes fleeing drifter drop all stolen motes & remove after 120 ticks', () => {
    const scenarioPath = path.resolve('temp_fr2_043_dp_s.json');
    const inputsPath = path.resolve('temp_fr2_043_dp_i.json');
    cleanups.push(scenarioPath, inputsPath);

    fs.writeFileSync(
      scenarioPath,
      JSON.stringify({
        player: { pos: [0, 0, 0], carried: 5, flames: 3 },
        random_motes: false,
        random_shades: false,
        random_drifters: false,
        motes: [],
        shades: [],
        drifters: [
          { id: 'D1', pos: [2, 1, 0], state: 'chase', stolen: 0 },
          { id: 'D2', pos: [-2, 1, 0], state: 'flee', stolen: 3 },
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
      night: 2,
      ticks: 125,
      snapshotEvery: 1,
      scenarioPath,
      inputsPath,
    });
    cleanups.push(res.outputPath);
    expect(res.status).toBe(0);

    const lines = res.readLines<any>();
    const pulseEv = lines.find((l) => l.type === 'event' && l.name === 'pulse');
    expect(pulseEv.data).toEqual({ stunned_ids: [] }); // Gió Lạc không vào stunned_ids

    const dropEv = lines.find((l) => l.type === 'event' && l.name === 'drifter_drop');
    expect(dropEv).toBeDefined();
    expect(dropEv.tick).toBe(1);
    expect(dropEv.data).toEqual({ drifter_id: 'D2', amount: 3 });

    const snap1 = lines.find((l) => l.type === 'snapshot' && l.tick === 1);
    expect(snap1.score).toBe(0); // không cộng điểm
    expect(snap1.drifters.find((d: any) => d.id === 'D1').state).toBe('flee');
    expect(snap1.drifters.find((d: any) => d.id === 'D2')).toMatchObject({
      state: 'flee',
      stolen: 0,
    });
    expect(snap1.motes).toHaveLength(3);
    expect(snap1.motes[0].kind).toBe('dropped');

    // Sau 120 tick (tick 121): D2 biến mất (removed)
    const snap121 = lines.find((l) => l.type === 'snapshot' && l.tick === 121);
    expect(snap121.drifters.find((d: any) => d.id === 'D2').state).toBe('removed');
  });
});
