import { describe, it, expect, afterEach } from 'vitest';
import { runCliSync } from '../cli-helper.js';
import fs from 'node:fs';
import path from 'node:path';

describe('FR-044: Invalid inputs handling', () => {
  const cleanups: string[] = [];

  afterEach(() => {
    for (const f of cleanups) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    cleanups.length = 0;
  });

  it('exits with code 2 when ticks are not strictly increasing', () => {
    const inputsPath = path.resolve('temp_invalid_tick_inputs.json');
    cleanups.push(inputsPath);

    fs.writeFileSync(
      inputsPath,
      JSON.stringify({
        frames: [
          { tick: 10, move: [0, 0] },
          { tick: 5, move: [0, 0] },
        ],
      })
    );

    const res = runCliSync({
      seed: 1,
      night: 1,
      ticks: 20,
      inputsPath,
    });
    cleanups.push(res.outputPath);

    expect(res.status).toBe(2);
    expect(res.stderr).toContain('strictly increasing');
  });

  it('exits with code 2 when move components exceed [-1, 1]', () => {
    const inputsPath = path.resolve('temp_invalid_move_inputs.json');
    cleanups.push(inputsPath);

    fs.writeFileSync(
      inputsPath,
      JSON.stringify({
        frames: [{ tick: 0, move: [1.2, 0] }],
      })
    );

    const res = runCliSync({
      seed: 1,
      night: 1,
      ticks: 20,
      inputsPath,
    });
    cleanups.push(res.outputPath);

    expect(res.status).toBe(2);
    expect(res.stderr).toContain('move components must be in [-1, 1]');
  });

  it('exits with code 2 when JSON syntax is corrupted', () => {
    const inputsPath = path.resolve('temp_corrupted_inputs.json');
    cleanups.push(inputsPath);

    fs.writeFileSync(inputsPath, '{ "frames": [ bad_json }');

    const res = runCliSync({
      seed: 1,
      night: 1,
      ticks: 20,
      inputsPath,
    });
    cleanups.push(res.outputPath);

    expect(res.status).toBe(2);
  });
});
