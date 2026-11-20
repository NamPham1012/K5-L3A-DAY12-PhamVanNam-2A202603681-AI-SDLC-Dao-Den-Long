import { describe, it, expect, afterEach } from 'vitest';
import { runCliSync } from '../cli-helper.js';
import fs from 'node:fs';

describe('FR2-052 / FR2-055: Contract v1.1 snapshot schema, night_start and determinism', () => {
  const cleanups: string[] = [];

  afterEach(() => {
    for (const f of cleanups) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    cleanups.length = 0;
  });

  it('FR2-052: emits night_start at tick 0 before snapshot and includes all v1.1 fields', () => {
    const res = runCliSync({
      seed: 123,
      night: 1,
      ticks: 20,
      snapshotEvery: 10,
    });
    cleanups.push(res.outputPath);

    expect(res.status).toBe(0);
    const lines = res.readLines<any>();

    // Dòng 0: event night_start {night: 1} tại tick 0 trước snapshot tick 0
    expect(lines[0]).toEqual({
      type: 'event',
      tick: 0,
      name: 'night_start',
      data: { night: 1 },
    });

    // Dòng 1: snapshot tick 0 đủ các trường v1.1
    const snap0 = lines[1];
    expect(snap0.type).toBe('snapshot');
    expect(snap0.tick).toBe(0);
    expect(snap0.sim_tick).toBe(0);
    expect(snap0.night).toBe(1);
    expect(snap0.wind).toEqual({ active: false, dir_deg: 0 });
    expect(snap0.state).toBe('playing');

    // Player v1.1 fields
    expect(snap0.player).toMatchObject({
      pos: [0, 0, 0],
      vel: [0, 0, 0],
      grounded: true,
      flames: 3,
      carried: 0,
      invuln: 0,
      dash_cd_s: 0,
      pulse_cd_s: 0,
      charm_s: 0,
    });

    // Required arrays in v1.1
    expect(Array.isArray(snap0.motes)).toBe(true);
    expect(snap0.motes).toHaveLength(20);
    expect(snap0.motes_active).toBe(20);
    expect(snap0.motes[0]).toHaveProperty('id');
    expect(snap0.motes[0]).toHaveProperty('pos');
    expect(snap0.motes[0].kind).toBe('random');
    expect(snap0.motes[0].ttl_s).toBeNull();

    expect(Array.isArray(snap0.drifters)).toBe(true);
    expect(Array.isArray(snap0.charms)).toBe(true);
    expect(snap0.shades).toHaveLength(0);
  });

  it('FR2-052: byte-identical determinism for two runs on v1.1', () => {
    const r1 = runCliSync({ seed: 555, night: 1, ticks: 350, snapshotEvery: 50 });
    const r2 = runCliSync({ seed: 555, night: 1, ticks: 350, snapshotEvery: 50 });
    cleanups.push(r1.outputPath, r2.outputPath);

    expect(r1.status).toBe(0);
    expect(r2.status).toBe(0);
    expect(fs.readFileSync(r1.outputPath).equals(fs.readFileSync(r2.outputPath))).toBe(true);
  });
});
