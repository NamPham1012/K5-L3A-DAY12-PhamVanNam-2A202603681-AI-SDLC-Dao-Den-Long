import { expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { runCliSync } from '../cli-helper.js';

it('FR4-002: bench mặc định tắt, JSONL giữ nguyên so với bản trước Phase 4', () => {
  const run = runCliSync({seed:42, night:1, ticks:1200});
  try {
    expect(run.status).toBe(0);
    const hash = createHash('sha256').update(fs.readFileSync(run.outputPath)).digest('hex');
    expect(hash).toBe('3d7ceaa67c86427864faa6f59e4ef93d5bc81288caa42b96d88270301c3bdd80');
  } finally { if (fs.existsSync(run.outputPath)) fs.unlinkSync(run.outputPath); }
});
