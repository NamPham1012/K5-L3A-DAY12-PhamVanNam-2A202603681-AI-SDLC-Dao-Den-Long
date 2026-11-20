import { describe, it, expect, afterEach } from 'vitest';
import { runCliSync } from '../cli-helper.js';
import fs from 'node:fs';
import path from 'node:path';
import { TUNING } from '../../../src/core/tuning.js';

describe('FR-003 / FR-010: Pickup, deposit and light lantern in tick 1 (US2 Independent Test)', () => {
  const cleanups: string[] = [];

  afterEach(() => {
    for (const f of cleanups) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    cleanups.length = 0;
  });

  it('picks mote, deposits to L1, and lights L1 in tick 1 in strict order', () => {
    const scenarioPath = path.resolve('temp_pickup_deposit_scenario.json');
    const inputsPath = path.resolve('temp_pickup_deposit_inputs.json');
    cleanups.push(scenarioPath, inputsPath);

    fs.writeFileSync(
      scenarioPath,
      JSON.stringify({
        random_motes: false,
        random_shades: false,
        motes: [[0, 0, 0]],
        shades: [],
        lanterns: [{ id: 'L1', pos: [0, 0, 0], deposited: TUNING.lantern_cost - 1 }],
      })
    );

    fs.writeFileSync(
      inputsPath,
      JSON.stringify({
        frames: [{ tick: 0, interact: true }],
      })
    );

    const res = runCliSync({
      seed: 42,
      night: 1,
      ticks: 1,
      snapshotEvery: 1,
      scenarioPath,
      inputsPath,
    });
    cleanups.push(res.outputPath);

    expect(res.status).toBe(0);
    const lines = res.readLines<any>();

    // Snapshot tick 0 (v1.1 có night_start tại tick 0 trước snapshot)
    const snap0 = lines.find((l) => l.type === 'snapshot' && l.tick === 0);
    expect(snap0).toBeDefined();

    // Events in tick 1
    const events = lines.filter((l) => l.type === 'event' && l.tick === 1);
    expect(events).toHaveLength(3);

    // Strict order: mote_picked -> deposit -> lantern_lit
    expect(events[0].name).toBe('mote_picked');
    expect(events[0].data).toEqual({ carried: 1 });

    expect(events[1].name).toBe('deposit');
    expect(events[1].data).toEqual({
      lantern_id: 'L1',
      amount: 1,
      deposited: TUNING.lantern_cost,
    });

    expect(events[2].name).toBe('lantern_lit');
    expect(events[2].data).toEqual({ lantern_id: 'L1', relight: false });

    // Snapshot tick 1
    const snap1 = lines.find((l) => l.type === 'snapshot' && l.tick === 1);
    expect(snap1).toBeDefined();
    const l1 = snap1.lanterns.find((l: any) => l.id === 'L1');
    expect(l1.lit).toBe(true);
    expect(snap1.score).toBe(TUNING.score.per_mote + TUNING.score.per_lantern);
  });
});
