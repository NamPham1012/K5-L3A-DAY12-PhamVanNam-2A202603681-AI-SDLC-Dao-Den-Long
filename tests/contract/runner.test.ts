import { describe, it, expect, afterEach } from 'vitest';
import { runCliSync } from './cli-helper.js';
import fs from 'node:fs';

describe('FR-040 / FR-041 / FR-042: Headless CLI runner contract', () => {
  const cleanups: string[] = [];

  afterEach(() => {
    for (const f of cleanups) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    cleanups.length = 0;
  });

  it('FR-040: runs with valid arguments and outputs snapshot tick 0, intervals, and end', () => {
    const res = runCliSync({
      seed: 100,
      night: 1,
      ticks: 20,
      snapshotEvery: 10,
    });
    cleanups.push(res.outputPath);

    expect(res.status).toBe(0);
    const lines = res.readLines<any>();
    expect(lines.length).toBeGreaterThanOrEqual(3);

    // Phase 2 (v1.1): night_start tại tick 0 trước snapshot tick 0
    expect(lines[0].type).toBe('event');
    expect(lines[0].name).toBe('night_start');
    expect(lines[1].type).toBe('snapshot');
    expect(lines[1].tick).toBe(0);
    expect(lines[1].sim_tick).toBe(0);
    expect(lines[1].state).toBe('playing');

    // Snapshot tick 10
    const snap10 = lines.find((l) => l.type === 'snapshot' && l.tick === 10);
    expect(snap10).toBeDefined();

    // Snapshot tick 20
    const snap20 = lines.find((l) => l.type === 'snapshot' && l.tick === 20);
    expect(snap20).toBeDefined();

    // End line is last
    const lastLine = lines[lines.length - 1];
    expect(lastLine.type).toBe('end');
    expect(lastLine.ticks).toBe(20);
    expect(lastLine.state).toBe('playing');
  });

  it('FR-040: exits with code 2 on invalid night', () => {
    // Phase 2 (v1.1): --night nhận 1, 2, 3 nên kiểm tra lỗi bằng 4
    const res = runCliSync({
      rawArgs: ['dist/headless.js', '--seed', '1', '--night', '4', '--ticks', '10', '--out', 'dummy.jsonl'],
    });
    expect(res.status).toBe(2);
    expect(res.stderr).toContain('--night must be 1, 2, or 3');
  });

  it('FR-040: exits with code 2 on missing required arguments', () => {
    const res = runCliSync({
      rawArgs: ['dist/headless.js', '--seed', '1'],
    });
    expect(res.status).toBe(2);
  });

  it('FR-040: exits with code 2 on non-positive snapshot-every', () => {
    const res = runCliSync({
      rawArgs: [
        'dist/headless.js',
        '--seed',
        '1',
        '--night',
        '1',
        '--ticks',
        '10',
        '--out',
        'dummy.jsonl',
        '--snapshot-every',
        '0',
      ],
    });
    expect(res.status).toBe(2);
    expect(res.stderr).toContain('--snapshot-every must be a positive integer');
  });
});
