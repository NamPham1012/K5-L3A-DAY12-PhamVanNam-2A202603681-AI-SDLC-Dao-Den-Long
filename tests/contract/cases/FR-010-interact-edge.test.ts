import { describe, it, expect, afterEach } from 'vitest';
import { runCliSync } from '../cli-helper.js';
import fs from 'node:fs';
import path from 'node:path';

describe('FR-010: Interact rising edge triggering', () => {
  const cleanups: string[] = [];

  afterEach(() => {
    for (const f of cleanups) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    cleanups.length = 0;
  });

  it('triggers deposit only once when interact remains continuously true', () => {
    const scenarioPath = path.resolve('temp_interact_edge_scenario.json');
    const inputsPath = path.resolve('temp_interact_edge_inputs.json');
    cleanups.push(scenarioPath, inputsPath);

    fs.writeFileSync(
      scenarioPath,
      JSON.stringify({
        player: { pos: [0, 0, 0], carried: 5 },
        random_motes: false,
        random_shades: false,
        motes: [],
        shades: [],
        lanterns: [{ id: 'L1', pos: [0, 0, 0], deposited: 0 }],
      })
    );

    // Continuous interact from tick 0 onwards
    fs.writeFileSync(
      inputsPath,
      JSON.stringify({
        frames: [{ tick: 0, interact: true }],
      })
    );

    const res = runCliSync({
      seed: 42,
      night: 1,
      ticks: 5,
      snapshotEvery: 1,
      scenarioPath,
      inputsPath,
    });
    cleanups.push(res.outputPath);

    expect(res.status).toBe(0);
    const lines = res.readLines<any>();

    const depositEvents = lines.filter((l) => l.type === 'event' && l.name === 'deposit');
    // Only one deposit at tick 1
    expect(depositEvents).toHaveLength(1);
    expect(depositEvents[0].tick).toBe(1);
    expect(depositEvents[0].data.amount).toBe(5);
  });
});
