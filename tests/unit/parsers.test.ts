import { describe, it, expect } from 'vitest';
import { InputParser } from '../../src/headless/inputs.js';
import { parseScenarioFile } from '../../src/headless/scenario.js';
import fs from 'node:fs';
import path from 'node:path';

describe('Input and Scenario Parsers (T011 / FR-044 / FR-043)', () => {
  it('should parse valid input frames and fill absent fields correctly', () => {
    const parser = new InputParser();
    parser.parse({
      frames: [
        { tick: 0, move: [0, 1], cam_yaw_deg: 90 },
        { tick: 2, interact: true },
        { tick: 3, interact: false },
      ],
    });

    const timeline = parser.buildTimeline(4);
    expect(timeline).toHaveLength(4);

    // Tick 0: move [0, 1], yaw 90, interact false
    expect(timeline[0].move).toEqual([0, 1]);
    expect(timeline[0].cam_yaw_deg).toBe(90);
    expect(timeline[0].interact).toBe(false);

    // Tick 1: retains tick 0 state
    expect(timeline[1].move).toEqual([0, 1]);
    expect(timeline[1].cam_yaw_deg).toBe(90);
    expect(timeline[1].interact).toBe(false);

    // Tick 2: interact becomes true
    expect(timeline[2].interact).toBe(true);

    // Tick 3: interact becomes false
    expect(timeline[3].interact).toBe(false);
  });

  it('should reject non-increasing frame ticks', () => {
    const parser = new InputParser();
    expect(() =>
      parser.parse({
        frames: [
          { tick: 5, move: [0, 0] },
          { tick: 3, move: [1, 0] },
        ],
      })
    ).toThrow();
  });

  it('should reject invalid move components', () => {
    const parser = new InputParser();
    expect(() =>
      parser.parse({
        frames: [{ tick: 0, move: [1.5, 0] }],
      })
    ).toThrow();
  });

  it('should normalize move vector with length > 1', () => {
    const parser = new InputParser();
    parser.parse({
      frames: [{ tick: 0, move: [1, 1] }],
    });
    const timeline = parser.buildTimeline(1);
    const [x, z] = timeline[0].move;
    expect(x * x + z * z).toBeCloseTo(1.0, 5);
  });

  it('should parse scenario file properly', () => {
    const tmpFile = path.resolve('temp_scenario_test.json');
    fs.writeFileSync(
      tmpFile,
      JSON.stringify({
        player: { pos: [0, 0, 0], carried: 2, flames: 3 },
        random_motes: false,
        random_shades: false,
        motes: [[1, 0, 2]],
        shades: [{ id: 'S1', pos: [10, 0, 10] }],
        lanterns: [{ id: 'L1', lit: true }],
        time_left_s: 200,
      })
    );

    try {
      const data = parseScenarioFile(tmpFile);
      expect(data.player?.carried).toBe(2);
      expect(data.random_motes).toBe(false);
      expect(data.motes).toHaveLength(1);
      expect(data.shades?.[0].id).toBe('S1');
      expect(data.lanterns?.[0].lit).toBe(true);
      expect(data.time_left_s).toBe(200);
    } finally {
      fs.unlinkSync(tmpFile);
    }
  });
});
