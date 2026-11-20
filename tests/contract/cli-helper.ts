import { spawnSync, SpawnSyncReturns } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export interface CliRunOptions {
  seed?: number;
  night?: number;
  ticks?: number;
  out?: string;
  snapshotEvery?: number;
  scenarioPath?: string;
  inputsPath?: string;
  rawArgs?: string[];
}

export interface CliResult {
  status: number | null;
  stdout: string;
  stderr: string;
  outputPath: string;
  readLines: <T = unknown>() => T[];
}

export function runCliSync(opts: CliRunOptions): CliResult {
  let outFile = opts.out;
  if (!outFile) {
    if (opts.rawArgs) {
      const outIdx = opts.rawArgs.indexOf('--out');
      if (outIdx !== -1 && opts.rawArgs[outIdx + 1]) {
        outFile = opts.rawArgs[outIdx + 1];
      }
    }
  }
  if (!outFile) {
    outFile = path.resolve(`temp_test_${crypto.randomUUID()}.jsonl`);
  }

  const args = opts.rawArgs
    ? [...opts.rawArgs]
    : [
        'dist/headless.js',
        '--seed',
        String(opts.seed ?? 42),
        '--night',
        String(opts.night ?? 1),
        '--ticks',
        String(opts.ticks ?? 10),
        '--out',
        outFile,
      ];

  if (!opts.rawArgs) {
    if (opts.snapshotEvery !== undefined) {
      args.push('--snapshot-every', String(opts.snapshotEvery));
    }
    if (opts.scenarioPath !== undefined) {
      args.push('--scenario', opts.scenarioPath);
    }
    if (opts.inputsPath !== undefined) {
      args.push('--inputs', opts.inputsPath);
    }
  }

  const ret: SpawnSyncReturns<string> = spawnSync('node', args, {
    encoding: 'utf8',
    cwd: process.cwd(),
  });

  return {
    status: ret.status,
    stdout: ret.stdout,
    stderr: ret.stderr,
    outputPath: outFile,
    readLines: <T = unknown>(): T[] => {
      if (!fs.existsSync(outFile)) {
        return [];
      }
      const content = fs.readFileSync(outFile, 'utf8').trim();
      if (!content) return [];
      return content.split(/\r?\n/).map((line) => JSON.parse(line) as T);
    },
  };
}
