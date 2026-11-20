import { describe, it, expect, afterEach } from 'vitest';
import { runCliSync } from '../cli-helper.js';
import fs from 'node:fs';
import path from 'node:path';

describe('FR-010 / US5: Web & contract win scenario verification', () => {
  const cleanups: string[] = [];

  afterEach(() => {
    for (const f of cleanups) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    cleanups.length = 0;
  });

  it('scenario with 5 lit lanterns yields won all_lit in tick 1 with end state won', () => {
    const scenarioPath = path.resolve('temp_ui_win_scenario.json');
    cleanups.push(scenarioPath);

    fs.writeFileSync(
      scenarioPath,
      JSON.stringify({
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
    expect(gameOver.data).toEqual({ result: 'won', reason: 'all_lit' });

    const endLine = lines[lines.length - 1];
    expect(endLine.type).toBe('end');
    expect(endLine.ticks).toBe(1);
    expect(endLine.state).toBe('won');
  });
});
