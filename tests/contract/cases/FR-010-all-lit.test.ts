import { describe, it, expect, afterEach } from 'vitest';
import { runCliSync } from '../cli-helper.js';
import fs from 'node:fs';
import path from 'node:path';

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

    // Ticket-03: full illumination does not end the night early.
    const gameOver = lines.find((l) => l.type === 'event' && l.name === 'game_over');
    expect(gameOver).toBeUndefined();

    const snap1 = lines.find((l) => l.type === 'snapshot' && l.tick === 1);
    expect(snap1.state).toBe('playing');
    expect(snap1.score).toBe(0);

    // End line
    const last = lines[lines.length - 1];
    expect(last.type).toBe('end');
    expect(last.ticks).toBe(5);
    expect(last.state).toBe('playing');
    expect(last.score).toBe(0);
  });
});
