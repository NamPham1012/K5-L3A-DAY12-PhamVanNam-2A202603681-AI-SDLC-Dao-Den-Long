import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const proofDir = path.resolve('docs/proof/phase-1');
if (!fs.existsSync(proofDir)) {
  fs.mkdirSync(proofDir, { recursive: true });
}

console.log('--- ĐẢO ĐÈN LỒNG: BẮT ĐẦU VERIFY PHASE 1 ---');

// 1. Build
console.log('1. Building headless bundle...');
execSync('node esbuild.config.mjs', { stdio: 'inherit' });

// 2. Chạy Vitest test suite và ghi log thật
console.log('2. Running Vitest test suite...');
const testLogPath = path.join(proofDir, 'test.log');
try {
  const output = execSync('npx vitest run', { encoding: 'utf8' });
  fs.writeFileSync(testLogPath, output, 'utf8');
  console.log(output);
  console.log(`Saved test log to: ${testLogPath}`);
} catch (err) {
  if (err.stdout) {
    fs.writeFileSync(testLogPath, err.stdout + '\n' + (err.stderr || ''), 'utf8');
  }
  console.error('Vitest test failed!');
  process.exit(1);
}

// 3. Chạy một màn headless mẫu và lưu JSONL thật
console.log('3. Generating sample headless JSONL proof...');
const sampleJsonlPath = path.join(proofDir, 'sample-run.jsonl');
execSync(
  `node dist/headless.js --seed 42 --night 1 --ticks 60 --out "${sampleJsonlPath}" --snapshot-every 10`,
  { stdio: 'inherit' }
);
console.log(`Saved sample JSONL proof to: ${sampleJsonlPath}`);

console.log('--- VERIFY HOÀN TẤT THÀNH CÔNG (PASS) ---');
