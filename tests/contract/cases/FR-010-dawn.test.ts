import { describe, it, expect, afterEach } from 'vitest';
import { runCliSync } from '../cli-helper.js';
import fs from 'node:fs';
import path from 'node:path';

describe('FR-010: Game over lost due to dawn (time expires)', () => {
  const cleanups: string[] = [];

  afterEach(() => {
    for (const f of cleanups) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    cleanups.length = 0;
  });

  it('triggers game_over lost dawn when time_left_s reaches 0 without all lanterns lit', () => {
    const scenarioPath = path.resolve('temp_dawn_scenario.json');
    cleanups.push(scenarioPath);

    // Initial time_left_s = 1/60s (0.016666...) so at tick 1 it becomes 0
    fs.writeFileSync(
      scenarioPath,
      JSON.stringify({
        player: { pos: [0, 0, 0], flames: 3 },
        random_motes: false,
        random_shades: false,
        motes: [],
        shades: [],
        time_left_s: 1 / 60,
      })
    );

    const res = runCliSync({
      seed: 42,
      night: 1,
      ticks: 10,
      snapshotEvery: 1,
      scenarioPath,
    });
    cleanups.push(res.outputPath);

    expect(res.status).toBe(0);
    const lines = res.readLines<any>();

    const gameOver = lines.find((l) => l.type === 'event' && l.name === 'game_over');
    expect(gameOver).toBeDefined();
    expect(gameOver.data).toEqual({ result: 'lost', reason: 'dawn' });

    // No bonus awarded on lost
    const last = lines[lines.length - 1];
    expect(last.type).toBe('end');
    expect(last.ticks).toBe(1);
    expect(last.state).toBe('lost');
    expect(last.score).toBe(0);
  });
});
