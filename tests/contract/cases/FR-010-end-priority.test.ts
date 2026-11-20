import { describe, it, expect, afterEach } from 'vitest';
import { runCliSync } from '../cli-helper.js';
import fs from 'node:fs';
import path from 'node:path';

describe('FR-010 / FR2-014: Game over priority (Phase 2 Ticket-02: no_flames > won/all_lit > dawn)', () => {
  const cleanups: string[] = [];

  afterEach(() => {
    for (const f of cleanups) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    cleanups.length = 0;
  });

  it('prioritizes no_flames over won/all_lit when all lanterns lit and player loses last flame in the same tick', () => {
    const scenarioPath = path.resolve('temp_priority_won_scenario.json');
    cleanups.push(scenarioPath);

    // 5 đèn đã sáng, nhưng player chỉ còn 1 lửa và rơi dưới Y = -10 ở tick 1 -> hết lửa luôn thua (no_flames)
    fs.writeFileSync(
      scenarioPath,
      JSON.stringify({
        player: { pos: [45, -10.5, 0], flames: 1, carried: 0 },
        random_motes: false,
        random_shades: false,
        motes: [],
        lanterns: [
          { id: 'L1', lit: true },
          { id: 'L2', lit: true },
          { id: 'L3', lit: true },
          { id: 'L4', lit: true },
          { id: 'L5', lit: true },
        ],
        shades: [],
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
    // Phase 2 Ticket-02: hết Ngọn Lửa luôn thua (no_flames) kể cả khi tất cả đèn đã sáng
    expect(gameOver.data).toEqual({ result: 'lost', reason: 'no_flames' });

    const last = lines[lines.length - 1];
    expect(last.type).toBe('end');
    expect(last.state).toBe('lost');
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
