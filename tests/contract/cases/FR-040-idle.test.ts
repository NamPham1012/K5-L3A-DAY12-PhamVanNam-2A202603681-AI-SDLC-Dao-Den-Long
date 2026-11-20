import { describe, it, expect, afterEach } from 'vitest';
import { runCliSync } from '../cli-helper.js';
import fs from 'node:fs';
import path from 'node:path';

describe('FR-040: Idle scenario (US1 independent test)', () => {
  const cleanups: string[] = [];

  afterEach(() => {
    for (const f of cleanups) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    cleanups.length = 0;
  });

  it('runs idle scenario for 120 ticks, 13 snapshots at (0,0,0), ends at playing', () => {
    const scenarioPath = path.resolve('temp_idle_scenario.json');
    const inputsPath = path.resolve('temp_idle_inputs.json');
    cleanups.push(scenarioPath, inputsPath);

    fs.writeFileSync(
      scenarioPath,
      JSON.stringify({
        random_motes: false,
        random_shades: false,
        motes: [],
        shades: [],
      })
    );

    fs.writeFileSync(
      inputsPath,
      JSON.stringify({
        frames: [],
      })
    );

    const res = runCliSync({
      seed: 42,
      night: 1,
      ticks: 120,
      snapshotEvery: 10,
      scenarioPath,
      inputsPath,
    });
    cleanups.push(res.outputPath);

    expect(res.status).toBe(0);
    const lines = res.readLines<any>();

    // Snapshots: tick 0, 10, 20, ..., 120 -> total 13 snapshots
    const snapshots = lines.filter((l) => l.type === 'snapshot');
    expect(snapshots).toHaveLength(13);

    for (let i = 0; i <= 12; i++) {
      const snap = snapshots[i];
      expect(snap.tick).toBe(i * 10);
      expect(snap.sim_tick).toBe(i * 10);
      expect(snap.player.pos).toEqual([0, 0, 0]);
      expect(snap.state).toBe('playing');
    }

    const last = lines[lines.length - 1];
    expect(last.type).toBe('end');
    expect(last.ticks).toBe(120);
    expect(last.state).toBe('playing');
  });
});
