import { describe, it, expect, afterEach } from 'vitest';
import { runCliSync } from '../cli-helper.js';
import fs from 'node:fs';
import path from 'node:path';
import { TUNING } from '../../../src/core/tuning.js';

describe('FR-010: Game over priority (won > no_flames > dawn)', () => {
  const cleanups: string[] = [];

  afterEach(() => {
    for (const f of cleanups) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    cleanups.length = 0;
  });

  it('prioritizes won over no_flames when all lit and hit in the same tick', () => {
    const scenarioPath = path.resolve('temp_priority_won_scenario.json');
    const inputsPath = path.resolve('temp_priority_won_inputs.json');
    cleanups.push(scenarioPath, inputsPath);

    // L2..L5 are lit, L1 is at (0,0,0) with deposited 7/8
    // Player at (0,0,0) with flames 1, carried 1
    // Shade at (0,1,0) touches player
    fs.writeFileSync(
      scenarioPath,
      JSON.stringify({
        player: { pos: [0, 0, 0], flames: 1, carried: 1 },
        random_motes: false,
        random_shades: false,
        motes: [],
        lanterns: [
          { id: 'L1', pos: [0, 0, 0], deposited: TUNING.lantern_cost - 1, lit: false },
          { id: 'L2', lit: true },
          { id: 'L3', lit: true },
          { id: 'L4', lit: true },
          { id: 'L5', lit: true },
        ],
        shades: [{ id: 'S1', pos: [0, 1, 0] }],
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

    const gameOver = lines.find((l) => l.type === 'event' && l.name === 'game_over');
    expect(gameOver).toBeDefined();
    // Must be won / all_lit according to priority rule
    expect(gameOver.data).toEqual({ result: 'won', reason: 'all_lit' });

    const last = lines[lines.length - 1];
    expect(last.type).toBe('end');
    expect(last.state).toBe('won');
  });

  it('prioritizes no_flames over dawn when flames 0 and time 0 in the same tick', () => {
    const scenarioPath = path.resolve('temp_priority_flames_dawn_scenario.json');
    cleanups.push(scenarioPath);

    fs.writeFileSync(
      scenarioPath,
      JSON.stringify({
        player: { pos: [0, 0, 0], flames: 1 },
        random_motes: false,
        random_shades: false,
        motes: [],
        shades: [{ id: 'S1', pos: [0, 1, 0] }],
        time_left_s: 1 / 60,
      })
    );

    const res = runCliSync({
      seed: 42,
      night: 1,
      ticks: 1,
      snapshotEvery: 1,
      scenarioPath,
    });
    cleanups.push(res.outputPath);

    expect(res.status).toBe(0);
    const lines = res.readLines<any>();

    const gameOver = lines.find((l) => l.type === 'event' && l.name === 'game_over');
    expect(gameOver).toBeDefined();
    // Must be lost / no_flames
    expect(gameOver.data).toEqual({ result: 'lost', reason: 'no_flames' });

    const last = lines[lines.length - 1];
    expect(last.type).toBe('end');
    expect(last.state).toBe('lost');
  });
});
