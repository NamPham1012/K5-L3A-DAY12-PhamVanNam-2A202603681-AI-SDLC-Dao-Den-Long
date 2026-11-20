import { describe, it, expect, afterEach } from 'vitest';
import { runCliSync } from '../cli-helper.js';
import fs from 'node:fs';
import path from 'node:path';

describe('FR-010: Pulse with insufficient carried motes', () => {
  const cleanups: string[] = [];

  afterEach(() => {
    for (const f of cleanups) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    cleanups.length = 0;
  });

  it('does nothing when carried < pulse_cost', () => {
    const scenarioPath = path.resolve('temp_pulse_insufficient_scenario.json');
    const inputsPath = path.resolve('temp_pulse_insufficient_inputs.json');
    cleanups.push(scenarioPath, inputsPath);

    fs.writeFileSync(
      scenarioPath,
      JSON.stringify({
        player: { pos: [0, 0, 0], carried: 1, flames: 3 },
        random_motes: false,
        random_shades: false,
        motes: [],
        shades: [{ id: 'S1', pos: [10, 1, 0] }],
      })
    );

    fs.writeFileSync(
      inputsPath,
      JSON.stringify({
        frames: [{ tick: 0, pulse: true }],
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

    const pulseEvents = lines.filter((l) => l.type === 'event' && l.name === 'pulse');
    expect(pulseEvents).toHaveLength(0);

    const snap1 = lines.find((l) => l.type === 'snapshot' && l.tick === 1);
    expect(snap1.player.carried).toBe(1);
    const s1 = snap1.shades.find((s: any) => s.id === 'S1');
    expect(s1.state).toBe('chase');
  });
});
