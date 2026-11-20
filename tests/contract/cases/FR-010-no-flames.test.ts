import { describe, it, expect, afterEach } from 'vitest';
import { runCliSync } from '../cli-helper.js';
import fs from 'node:fs';
import path from 'node:path';

describe('FR-010: Game over lost due to no_flames', () => {
  const cleanups: string[] = [];

  afterEach(() => {
    for (const f of cleanups) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    cleanups.length = 0;
  });

  it('triggers game_over lost no_flames when player flames reach 0', () => {
    const scenarioPath = path.resolve('temp_no_flames_scenario.json');
    cleanups.push(scenarioPath);

    fs.writeFileSync(
      scenarioPath,
      JSON.stringify({
        player: { pos: [0, 0, 0], flames: 1 },
        random_motes: false,
        random_shades: false,
        motes: [],
        shades: [{ id: 'S1', pos: [0, 1, 0] }],
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
    expect(gameOver.data).toEqual({ result: 'lost', reason: 'no_flames' });

    const last = lines[lines.length - 1];
    expect(last.type).toBe('end');
    expect(last.ticks).toBe(1);
    expect(last.state).toBe('lost');
  });
});
