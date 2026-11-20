import { describe, it, expect, afterEach } from 'vitest';
import { runCliSync } from '../cli-helper.js';
import fs from 'node:fs';
import path from 'node:path';

describe('FR-010: Pulse cooldown preventing rapid repeated activations', () => {
  const cleanups: string[] = [];

  afterEach(() => {
    for (const f of cleanups) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    cleanups.length = 0;
  });

  it('ignores second pulse activation while on cooldown', () => {
    const scenarioPath = path.resolve('temp_pulse_cd_scenario.json');
    const inputsPath = path.resolve('temp_pulse_cd_inputs.json');
    cleanups.push(scenarioPath, inputsPath);

    fs.writeFileSync(
      scenarioPath,
      JSON.stringify({
        player: { pos: [0, 0, 0], carried: 10, flames: 3 },
        random_motes: false,
        random_shades: false,
        motes: [],
        shades: [{ id: 'S1', pos: [3, 1, 0] }],
      })
    );

    // Pulse at tick 0 (release at 1), pulse again at tick 2
    fs.writeFileSync(
      inputsPath,
      JSON.stringify({
        frames: [
          { tick: 0, pulse: true },
          { tick: 1, pulse: false },
          { tick: 2, pulse: true },
        ],
      })
    );

    const res = runCliSync({
      seed: 42,
      night: 1,
      ticks: 3,
      snapshotEvery: 1,
      scenarioPath,
      inputsPath,
    });
    cleanups.push(res.outputPath);

    expect(res.status).toBe(0);
    const lines = res.readLines<any>();

    const pulseEvents = lines.filter((l) => l.type === 'event' && l.name === 'pulse');
    // Only one pulse event in tick 1, none in tick 3 because pulse_cooldown_s = 2.0s (120 ticks)
    expect(pulseEvents).toHaveLength(1);
    expect(pulseEvents[0].tick).toBe(1);

    const snap3 = lines.find((l) => l.type === 'snapshot' && l.tick === 3);
    // Only 2 motes deducted (10 - 2 = 8)
    expect(snap3.player.carried).toBe(8);
  });
});
