import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { TUNING } from '../../../src/core/tuning.js';

describe('FR-061: game.contract.json tuning matches runtime', () => {
  it('should match all tuning properties between game.contract.json and TUNING', () => {
    const contractPath = path.resolve(process.cwd(), 'game.contract.json');
    const content = fs.readFileSync(contractPath, 'utf8');
    const contract = JSON.parse(content);

    // Phase 2 (Ticket-02): contract_version nâng lên 1.1
    expect(contract.contract_version).toBe('1.1');
    expect(contract.team).toBe('2A202603681-pham-van-nam');
    expect(contract.build_cmd).toBe('npm ci && npm run build');
    expect(contract.run_cmd).toBe('npm run play');
    expect(contract.headless_cmd).toBe('node dist/headless.js');

    expect(contract.tuning).toBeDefined();
    expect(contract.tuning).toEqual(TUNING);
  });
});
