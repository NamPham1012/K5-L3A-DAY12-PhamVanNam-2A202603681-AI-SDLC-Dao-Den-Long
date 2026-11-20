import { describe, it, expect, afterEach } from 'vitest';
import { runCliSync } from '../cli-helper.js';
import fs from 'node:fs';
import path from 'node:path';

describe('FR2-022: Shade hit recoil, invuln 90 ticks, dropped motes ring 1.5-2.5m & TTL 480', () => {
  const cleanups: string[] = [];

  afterEach(() => {
    for (const f of cleanups) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    cleanups.length = 0;
  });

  it('FR2-022: shade enters recoil 60 ticks, drops floor(carried/2) in [1.5, 2.5]m with TTL 480 ticks', () => {
    const scenarioPath = path.resolve('temp_fr2_022_hit_s.json');
    cleanups.push(scenarioPath);

    fs.writeFileSync(
      scenarioPath,
      JSON.stringify({
        player: { pos: [0, 0, 0], carried: 5, flames: 3 },
        random_motes: false,
        random_shades: false,
        motes: [],
        shades: [{ id: 'S1', pos: [0.5, 1, 0], state: 'chase' }],
      })
    );

    const res = runCliSync({
      seed: 7,
      night: 1,
      ticks: 490,
      snapshotEvery: 1,
      scenarioPath,
    });
    cleanups.push(res.outputPath);
    expect(res.status).toBe(0);

    const lines = res.readLines<any>();
    const hits = lines.filter((l) => l.type === 'event' && l.name === 'player_hit');
    expect(hits.length).toBeGreaterThanOrEqual(1);
    expect(hits[0].tick).toBe(1);
    expect(hits[0].data).toEqual({ by: 'shade', flames: 2, dropped: 2 });

    const snap1 = lines.find((l) => l.type === 'snapshot' && l.tick === 1);
    expect(snap1.player.carried).toBe(3);
    expect(snap1.player.invuln).toBe(1.5);
    expect(snap1.shades[0].state).toBe('recoil');
    expect(snap1.motes).toHaveLength(2);
    for (const m of snap1.motes) {
      expect(m.kind).toBe('dropped');
      expect(m.ttl_s).toBe(8); // 480 / 60 = 8s
      const dist = Math.hypot(m.pos[0], m.pos[2]);
      expect(dist).toBeGreaterThanOrEqual(1.49);
      expect(dist).toBeLessThanOrEqual(2.51);
    }

    // Sau 480 tick (tại tick 481), đom đóm rơi hết hạn biến mất
    const snap481 = lines.find((l) => l.type === 'snapshot' && l.tick === 481);
    if (snap481) {
      expect(snap481.motes.filter((m: any) => m.kind === 'dropped')).toHaveLength(0);
    }
  });
});
