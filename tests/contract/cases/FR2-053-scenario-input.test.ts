import { describe, it, expect, afterEach } from 'vitest';
import { runCliSync } from '../cli-helper.js';
import fs from 'node:fs';
import path from 'node:path';

describe('FR2-053 / FR2-054: Scenario v1.1 overrides, inputs dash/pause & error code 2', () => {
  const cleanups: string[] = [];

  afterEach(() => {
    for (const f of cleanups) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    cleanups.length = 0;
  });

  it('FR2-053: applies player timer ticks and shade state overrides from scenario', () => {
    const scenarioPath = path.resolve('temp_fr2_053_scenario.json');
    cleanups.push(scenarioPath);

    fs.writeFileSync(
      scenarioPath,
      JSON.stringify({
        player: {
          pos: [0, 0, 0],
          carried: 2,
          flames: 2,
          invuln_ticks: 60,
          dash_cd_ticks: 30,
          pulse_cd_ticks: 120,
          charm_ticks: 180,
        },
        random_motes: false,
        random_shades: false,
        random_drifters: false,
        wind_enabled: false,
        motes: [],
        shades: [{ id: 'S1', pos: [10, 1, 0], state: 'stunned', state_ticks_left: 60 }],
        drifters: [],
        charms: [],
      })
    );

    const res = runCliSync({
      seed: 1,
      night: 1,
      ticks: 1,
      snapshotEvery: 1,
      scenarioPath,
    });
    cleanups.push(res.outputPath);

    expect(res.status).toBe(0);
    const lines = res.readLines<any>();
    const snap0 = lines.find((l) => l.type === 'snapshot' && l.tick === 0);
    expect(snap0.player.invuln).toBe(1);
    expect(snap0.player.dash_cd_s).toBe(0.5);
    expect(snap0.player.pulse_cd_s).toBe(2);
    expect(snap0.player.charm_s).toBe(3);
    expect(snap0.shades[0].state).toBe('stunned');
  });

  it('FR2-054: accepts dash input and rejects invalid night or bad scenario schema with exit code 2', () => {
    const badNight = runCliSync({
      rawArgs: ['dist/headless.js', '--seed', '1', '--night', '4', '--ticks', '5', '--out', 'dummy.jsonl'],
    });
    expect(badNight.status).toBe(2);

    const badInput = path.resolve('temp_fr2_054_bad_input.json');
    cleanups.push(badInput);
    fs.writeFileSync(badInput, JSON.stringify({ frames: [{ tick: 0, dash: 'yes' }] }));

    const resBad = runCliSync({
      seed: 1,
      night: 1,
      ticks: 5,
      inputsPath: badInput,
    });
    cleanups.push(resBad.outputPath);
    expect(resBad.status).toBe(2);
  });
});
