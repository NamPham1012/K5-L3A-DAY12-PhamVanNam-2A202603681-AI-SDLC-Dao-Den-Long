import { describe, it, expect, afterEach } from 'vitest';
import { runCliSync } from '../cli-helper.js';
import fs from 'node:fs';
import path from 'node:path';
import { TUNING } from '../../../src/core/tuning.js';

describe('FR-010: Pre-lit all lanterns scenario (US2 / Edge case)', () => {
  const cleanups: string[] = [];

  afterEach(() => {
    for (const f of cleanups) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    cleanups.length = 0;
  });

  it('awards no per_lantern score on setup, ends with won all_lit in tick 1 with win bonus', () => {
    const scenarioPath = path.resolve('temp_all_lit_scenario.json');
    cleanups.push(scenarioPath);

    fs.writeFileSync(
      scenarioPath,
      JSON.stringify({
        player: { pos: [0, 0, 0], flames: 3, carried: 0 },
        random_motes: false,
        random_shades: false,
        motes: [],
        shades: [],
        lanterns: [
          { id: 'L1', lit: true },
          { id: 'L2', lit: true },
          { id: 'L3', lit: true },
          { id: 'L4', lit: true },
          { id: 'L5', lit: true },
        ],
        time_left_s: 100,
      })
    );

    const res = runCliSync({
      seed: 42,
      night: 1,
      ticks: 5,
      snapshotEvery: 1,
      scenarioPath,
    });
    cleanups.push(res.outputPath);

    expect(res.status).toBe(0);
    const lines = res.readLines<any>();

    // Snapshot tick 0 must have score = 0 (v1.1 có night_start tại tick 0 trước snapshot)
    const snap0 = lines.find((l) => l.type === 'snapshot' && l.tick === 0);
    expect(snap0).toBeDefined();
    expect(snap0.score).toBe(0);

    // Event in tick 1 is game_over won all_lit
    const gameOver = lines.find((l) => l.type === 'event' && l.name === 'game_over');
    expect(gameOver).toBeDefined();
    expect(gameOver.data).toEqual({ result: 'won', reason: 'all_lit' });

    // Bonus score: floor(time_left_s) * per_second_left + flames * per_flame_left
    // time_left_s at tick 1 is 100 - 1/60 = 99.9833 -> floor is 99
    const expectedBonus =
      99 * TUNING.score.per_second_left + 3 * TUNING.score.per_flame_left;

    const snap1 = lines.find((l) => l.type === 'snapshot' && l.tick === 1);
    expect(snap1.state).toBe('won');
    expect(snap1.score).toBe(expectedBonus);

    // End line
    const last = lines[lines.length - 1];
    expect(last.type).toBe('end');
    expect(last.ticks).toBe(1);
    expect(last.state).toBe('won');
    expect(last.score).toBe(expectedBonus);
  });
});
