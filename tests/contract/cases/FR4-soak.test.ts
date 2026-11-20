import { it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
it('FR4-010 chạy hai Đêm trong một tiến trình', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'soak-test-'));
  try {
    const out = path.join(dir, 'soak.json');
    const result = spawnSync(process.execPath, ['--expose-gc', 'dist/soak.js', '--seed', '7', '--nights', '2', '--out', out], {encoding:'utf8'});
    expect(result.status, result.stderr).toBe(0);
    const data = JSON.parse(fs.readFileSync(out, 'utf8'));
    expect(data.nights).toBe(2); expect(data.crashes).toBe(0); expect(data.results).toHaveLength(2);
    expect(data.results.every((state: string) => state === 'won' || state === 'lost')).toBe(true);
    expect(data.mem_start_mb).toBeGreaterThan(0); expect(data.mem_end_mb).toBeGreaterThan(0);
  } finally { fs.rmSync(dir, {recursive:true, force:true}); }
});
