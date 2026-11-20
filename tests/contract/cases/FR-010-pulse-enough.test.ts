import { describe, it, expect, afterEach } from 'vitest';
import { runCliSync } from '../cli-helper.js';
import fs from 'node:fs';
import path from 'node:path';
import { TUNING } from '../../../src/core/tuning.js';

describe('FR-010: Pulse execution when sufficient motes carried (US4 Independent Test)', () => {
  const cleanups: string[] = [];

  afterEach(() => {
    for (const f of cleanups) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    cleanups.length = 0;
  });

  it('triggers pulse in tick 1, stuns S1, deducts pulse_cost, adds score and prevents player_hit', () => {
    const scenarioPath = path.resolve('temp_pulse_enough_scenario.json');
    const inputsPath = path.resolve('temp_pulse_enough_inputs.json');
    cleanups.push(scenarioPath, inputsPath);

    fs.writeFileSync(
      scenarioPath,
      JSON.stringify({
        player: { pos: [0, 0, 0], carried: TUNING.pulse_cost },
        random_motes: false,
        random_shades: false,
        motes: [],
        shades: [{ id: 'S1', pos: [0, 1, 0] }],
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

    const events = lines.filter((l) => l.type === 'event');
    // Only pulse event, no player_hit event
    expect(events).toHaveLength(1);
    expect(events[0].name).toBe('pulse');
    expect(events[0].data).toEqual({ stunned_ids: ['S1'] });

    const snap1 = lines.find((l) => l.type === 'snapshot' && l.tick === 1);
    expect(snap1.player.carried).toBe(0);
    expect(snap1.score).toBe(TUNING.score.per_stun);

    const s1 = snap1.shades.find((s: any) => s.id === 'S1');
    expect(s1.state).toBe('stunned');
  });
});
