import { execSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const proofDir = path.resolve('docs/proof/phase-2');
if (!fs.existsSync(proofDir)) {
  fs.mkdirSync(proofDir, { recursive: true });
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

console.log('--- ĐẢO ĐÈN LỒNG: BẮT ĐẦU VERIFY PHASE 2 (CONTRACT v1.1) ---');

// 1. Build headless
console.log('1. Building headless bundle...');
execSync('node esbuild.config.mjs', { stdio: 'inherit' });

// 2. Chạy toàn bộ Vitest suite và lưu test.log
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

// 3. Chạy cả 3 Đêm 2 lần và so SHA-256 từng byte
console.log('3. Verifying determinism across Nights 1, 2, 3 (SHA-256)...');
const shaLines = [];
for (const night of [1, 2, 3]) {
  const outA = path.join(proofDir, `night${night}.jsonl`);
  const outB = path.join(proofDir, `night${night}.check.jsonl`);
  execSync(
    `node dist/headless.js --seed 42 --night ${night} --ticks 600 --out "${outA}" --snapshot-every 30`,
    { stdio: 'inherit' }
  );
  execSync(
    `node dist/headless.js --seed 42 --night ${night} --ticks 600 --out "${outB}" --snapshot-every 30`,
    { stdio: 'inherit' }
  );

  const hashA = sha256File(outA);
  const hashB = sha256File(outB);
  fs.unlinkSync(outB);

  if (hashA !== hashB) {
    console.error(`Determinism FAILED on night ${night}: ${hashA} !== ${hashB}`);
    process.exit(1);
  }
  shaLines.push(`night=${night} seed=42 ticks=600 sha256=${hashA} match=true`);
}
const shaFile = path.join(proofDir, 'determinism-sha256.txt');
fs.writeFileSync(shaFile, shaLines.join('\n') + '\n', 'utf8');
console.log(shaLines.join('\n'));

// 4. Đo hiệu năng 21.600 tick (không kết thúc sớm)
console.log('4. Benchmarking 21,600 ticks (Night 3)...');
const perfScenario = path.join(proofDir, 'perf-scenario.tmp.json');
const perfOut = path.join(proofDir, 'perf-run.tmp.jsonl');
fs.writeFileSync(
  perfScenario,
  JSON.stringify({
    player: { pos: [0, 0, -30], flames: 3 },
    random_motes: false,
    random_shades: false,
    random_drifters: false,
    wind_enabled: false,
    motes: [],
    shades: [],
    time_left_s: 400,
  })
);
const t0 = performance.now();
execSync(
  `node dist/headless.js --seed 42 --night 3 --scenario "${perfScenario}" --ticks 21600 --out "${perfOut}" --snapshot-every 600`,
  { stdio: 'inherit' }
);
const elapsedMs = performance.now() - t0;
const lines = fs.readFileSync(perfOut, 'utf8').trim().split(/\r?\n/);
const endObj = JSON.parse(lines[lines.length - 1]);
fs.unlinkSync(perfScenario);
fs.unlinkSync(perfOut);

if (endObj.ticks !== 21600 || elapsedMs > 30000) {
  console.error(`Perf check FAILED: ticks=${endObj.ticks}, elapsedMs=${elapsedMs}`);
  process.exit(1);
}

const perfMd = `# Performance Benchmark: Phase 2 — Headless 21.600 tick

- **Tiêu chuẩn**: FR2-056 / SC2-002 (chạy đủ 21.600 tick không kết thúc sớm trong ≤ 30 giây).
- **Lệnh đo**: \`node dist/headless.js --seed 42 --night 3 --scenario <idle-400s> --ticks 21600 --snapshot-every 600\`
- **Môi trường máy**: ${os.platform()} ${os.release()} (${os.arch()}), Node ${process.version}, CPU: ${os.cpus()[0]?.model ?? 'unknown'}
- **Kết quả thực tế**:
  - \`end.ticks\`: \`${endObj.ticks}\`
  - \`end.state\`: \`${endObj.state}\`
  - Thời gian chạy thực tế: **${elapsedMs.toFixed(2)} ms** (${(elapsedMs / 1000).toFixed(3)} s)
- **Kết luận Headless**: **ĐẠT** (${(elapsedMs / 1000).toFixed(3)} s ≤ 30 s).
- **Đo FPS Web (1280×720 trong 60s)**: **CHƯA ĐẠT** (chưa triển khai Nhóm C).
`;
fs.writeFileSync(path.join(proofDir, 'perf.md'), perfMd, 'utf8');
console.log(`Perf 21,600 ticks: ${elapsedMs.toFixed(2)} ms (end.ticks=${endObj.ticks})`);

console.log('--- VERIFY PHASE 2 HOÀN TẤT THÀNH CÔNG (PASS) ---');
