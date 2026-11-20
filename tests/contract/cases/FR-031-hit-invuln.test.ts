import { describe, it, expect, afterEach } from 'vitest';
import { runCliSync } from '../cli-helper.js';
import fs from 'node:fs';
import path from 'node:path';

describe('FR-031: Shade hit, invulnerability and death on 0 flames (US3 Independent Test)', () => {
  const cleanups: string[] = [];

  afterEach(() => {
    for (const f of cleanups) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    cleanups.length = 0;
  });

  it('loses last flame in tick 1, game over lost no_flames and stops (US3 Independent Test)', () => {
    const scenarioPath = path.resolve('temp_hit_death_scenario.json');
    cleanups.push(scenarioPath);

    fs.writeFileSync(
      scenarioPath,
      JSON.stringify({
        player: { pos: [0, 0, 0], carried: 0, flames: 1 },
        random_motes: false,
        random_shades: false,
        motes: [],
        shades: [{ id: 'S1', pos: [0, 0, 0] }],
      })
    );

    const res = runCliSync({
      seed: 42,
      night: 1,
      ticks: 10,
      snapshotEvery: 1,
      scenarioPath,
    });
    cleanups.push(res.outputPath);

    expect(res.status).toBe(0);
    const lines = res.readLines<any>();

    // Tick 1 has player_hit followed by game_over
    const events = lines.filter((l) => l.type === 'event');
    expect(events).toHaveLength(2);

    expect(events[0].name).toBe('player_hit');
    expect(events[0].data).toEqual({ by: 'shade', flames: 0, dropped: 0 });

    expect(events[1].name).toBe('game_over');
    expect(events[1].data).toEqual({ result: 'lost', reason: 'no_flames' });

    // End line has ticks: 1, state: lost
    const last = lines[lines.length - 1];
    expect(last.type).toBe('end');
    expect(last.ticks).toBe(1);
    expect(last.state).toBe('lost');
  });

  it('does not take damage during invulnerability period', () => {
    const scenarioPath = path.resolve('temp_hit_invuln_scenario.json');
    cleanups.push(scenarioPath);

    fs.writeFileSync(
      scenarioPath,
      JSON.stringify({
        player: { pos: [0, 0, 0], carried: 0, flames: 3 },
        random_motes: false,
        random_shades: false,
        motes: [],
        shades: [{ id: 'S1', pos: [0, 0, 0] }],
      })
    );

    // Run 30 ticks: only 1 hit event at tick 1, no further hit during invulnerability
    const res = runCliSync({
      seed: 42,
      night: 1,
      ticks: 30,
      snapshotEvery: 10,
      scenarioPath,
    });
    cleanups.push(res.outputPath);

    expect(res.status).toBe(0);
    const lines = res.readLines<any>();

    const hitEvents = lines.filter((l) => l.type === 'event' && l.name === 'player_hit');
    expect(hitEvents).toHaveLength(1);
    expect(hitEvents[0].tick).toBe(1);

    const snap30 = lines.find((l) => l.type === 'snapshot' && l.tick === 30);
    expect(snap30.player.flames).toBe(2);
  });
});
