import { describe, it, expect, afterEach } from 'vitest';
import { runCliSync } from '../cli-helper.js';
import { NIGHT1_MAP } from '../../../src/core/maps/night1.js';
import fs from 'node:fs';
import path from 'node:path';

describe('FR2-030: Night 1 standardized map coordinates, spawn rings and fall edge', () => {
  const cleanups: string[] = [];

  afterEach(() => {
    for (const f of cleanups) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    cleanups.length = 0;
  });

  it('FR2-030: verifies 5 lantern coordinates and spawn point formulas (r*cos, 0, r*sin)', () => {
    const res = runCliSync({ seed: 10, night: 1, ticks: 1, snapshotEvery: 1 });
    cleanups.push(res.outputPath);
    expect(res.status).toBe(0);

    const lines = res.readLines<any>();
    const snap0 = lines.find((l) => l.type === 'snapshot' && l.tick === 0);

    expect(snap0.lanterns).toEqual([
      { id: 'L1', pos: [0, 0, 25], lit: false, deposited: 0 },
      { id: 'L2', pos: [23.8, 0, 7.7], lit: false, deposited: 0 },
      { id: 'L3', pos: [14.7, 0, -20.2], lit: false, deposited: 0 },
      { id: 'L4', pos: [-14.7, 0, -20.2], lit: false, deposited: 0 },
      { id: 'L5', pos: [-23.8, 0, 7.7], lit: false, deposited: 0 },
    ]);

    // 24 điểm sinh đom đóm: 8 ở r12 (0°..315°), 16 ở r33 (0°..337.5°)
    expect(NIGHT1_MAP.moteSpawnPoints).toHaveLength(24);
    expect(NIGHT1_MAP.moteSpawnPoints[0][0]).toBeCloseTo(12, 5);
    expect(NIGHT1_MAP.moteSpawnPoints[0][2]).toBeCloseTo(0, 5);
    expect(NIGHT1_MAP.moteSpawnPoints[2][0]).toBeCloseTo(0, 5);
    expect(NIGHT1_MAP.moteSpawnPoints[2][2]).toBeCloseTo(12, 5); // 90° -> (0,0,12)

    // 12 điểm sinh Bóng Mực ở r37 (15°, 45°, ...)
    expect(NIGHT1_MAP.shadeSpawnPoints).toHaveLength(12);
    const rad15 = (15 * Math.PI) / 180;
    expect(NIGHT1_MAP.shadeSpawnPoints[0][0]).toBeCloseTo(37 * Math.cos(rad15), 5);
    expect(NIGHT1_MAP.shadeSpawnPoints[0][2]).toBeCloseTo(37 * Math.sin(rad15), 5);
  });

  it('FR2-030: player walking beyond r=40 falls into the cloud sea', () => {
    const scenarioPath = path.resolve('temp_fr2_030_fall_scenario.json');
    const inputsPath = path.resolve('temp_fr2_030_fall_inputs.json');
    cleanups.push(scenarioPath, inputsPath);

    fs.writeFileSync(
      scenarioPath,
      JSON.stringify({
        player: { pos: [39.9, 0, 0], flames: 3, carried: 2 },
        random_motes: false,
        random_shades: false,
        motes: [],
        shades: [],
      })
    );
    fs.writeFileSync(
      inputsPath,
      JSON.stringify({
        frames: [{ tick: 0, move: [1, 0] }],
      })
    );

    const res = runCliSync({
      seed: 1,
      night: 1,
      ticks: 100,
      snapshotEvery: 10,
      scenarioPath,
      inputsPath,
    });
    cleanups.push(res.outputPath);
    expect(res.status).toBe(0);

    const lines = res.readLines<any>();
    const fallHit = lines.find((l) => l.type === 'event' && l.name === 'player_hit');
    expect(fallHit).toBeDefined();
    expect(fallHit.data).toEqual({ by: 'fall', flames: 2, dropped: 0, lost: 2 });
  });
});
