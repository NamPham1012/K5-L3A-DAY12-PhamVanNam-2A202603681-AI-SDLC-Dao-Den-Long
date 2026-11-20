import { describe, it, expect, afterEach } from 'vitest';
import { runCliSync } from '../cli-helper.js';
import fs from 'node:fs';
import path from 'node:path';
import { TUNING } from '../../../src/core/tuning.js';

describe('FR-003: Carry capacity limit', () => {
  const cleanups: string[] = [];

  afterEach(() => {
    for (const f of cleanups) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    cleanups.length = 0;
  });

  it('does not pick mote when carried equals carry_capacity', () => {
    const scenarioPath = path.resolve('temp_capacity_scenario.json');
    cleanups.push(scenarioPath);

    fs.writeFileSync(
      scenarioPath,
      JSON.stringify({
        player: { pos: [0, 0, 0], carried: TUNING.carry_capacity },
        random_motes: false,
        random_shades: false,
        motes: [[0, 0, 0]],
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

    const events = lines.filter((l) => l.type === 'event');
    expect(events.filter((e: any) => e.name === 'mote_picked')).toHaveLength(0);

    const snap1 = lines.find((l) => l.type === 'snapshot' && l.tick === 1);
    expect(snap1.player.carried).toBe(TUNING.carry_capacity);
    expect(snap1.motes_active).toBe(1);
  });
});
