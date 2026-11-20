import { describe, it, expect } from 'vitest';
import { World } from '../../src/core/world.js';
import { TUNING } from '../../src/core/tuning.js';

describe('World initialization and data model', () => {
  it('should initialize with default state and contract entities', () => {
    const world = new World(123);

    expect(world.tick).toBe(0);
    expect(world.sim_tick).toBe(0);
    expect(world.state).toBe('playing');
    expect(world.time_left_s).toBe(TUNING.night1_duration_s);
    expect(world.score).toBe(0);

    // Player
    expect(world.player.pos).toEqual([0, 0, 0]);
    expect(world.player.flames).toBe(TUNING.flames);
    expect(world.player.carried).toBe(0);

    // Lanterns: 5 lanterns L1..L5
    expect(world.lanterns).toHaveLength(5);
    expect(world.lanterns[0].id).toBe('L1');
    expect(world.lanterns[0].pos).toEqual([0, 0, 25]);
    expect(world.lanterns[0].lit).toBe(false);
    expect(world.lanterns[0].deposited).toBe(0);

    // Default motes (Phase 2 Ticket-02): 20 active on fixed spawn points
    expect(world.motes.filter((m) => m.active)).toHaveLength(20);

    // Default shades (Phase 2 Ticket-02): 0 at tick 0 (2 spawn at tick 300)
    expect(world.shades).toHaveLength(0);
  });

  it('should apply scenario overrides properly', () => {
    const world = new World(123, {
      player: { pos: [5, 0, 10], carried: 3, flames: 2 },
      random_motes: false,
      random_shades: false,
      motes: [[1, 0, 1]],
      shades: [{ id: 'S9', pos: [10, 0, 0] }],
      lanterns: [{ id: 'L1', deposited: 5, lit: true }],
      time_left_s: 150,
    });

    expect(world.player.pos).toEqual([5, 0, 10]);
    expect(world.player.carried).toBe(3);
    expect(world.player.flames).toBe(2);
    expect(world.time_left_s).toBe(150);
    expect(world.initial_duration_s).toBe(150);

    expect(world.motes).toHaveLength(1);
    expect(world.motes[0].id).toBe('M1');
    expect(world.motes[0].pos).toEqual([1, 0, 1]);

    expect(world.shades).toHaveLength(1);
    expect(world.shades[0].id).toBe('S9');
    // Phase 2: giữ nguyên tọa độ theo tầng của scenario
    expect(world.shades[0].pos).toEqual([10, 0, 0]);

    const l1 = world.lanterns.find((l) => l.id === 'L1');
    expect(l1?.deposited).toBe(5);
    expect(l1?.lit).toBe(true);

    const snapshot = world.getSnapshot();
    expect(snapshot.tick).toBe(0);
    expect(snapshot.player.pos).toEqual([5, 0, 10]);
    expect(snapshot.motes_active).toBe(1);
  });
});
