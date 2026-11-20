import { World } from '../core/world.js';
import { TUNING } from '../core/tuning.js';
import { InputParser } from './inputs.js';
import { parseScenarioFile } from './scenario.js';
import { JsonlWriter } from './jsonl.js';
import path from 'node:path';
import fs from 'node:fs';

function exitWithError(message: string, code: number = 2): never {
  process.stderr.write(`Error: ${message}\n`);
  process.exit(code);
}

function parseArgs(args: string[]): {
  seed: number;
  night: 1 | 2 | 3;
  ticks: number;
  out: string;
  snapshotEvery: number;
  scenarioPath?: string;
  inputsPath?: string;
} {
  let seed: number | undefined;
  let night: 1 | 2 | 3 | undefined;
  let ticks: number | undefined;
  let out: string | undefined;
  let snapshotEvery = 10;
  let scenarioPath: string | undefined;
  let inputsPath: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--seed') {
      const val = args[++i];
      if (val === undefined || isNaN(Number(val))) {
        exitWithError('Missing or invalid --seed value');
      }
      seed = parseInt(val, 10);
    } else if (arg === '--night') {
      const val = args[++i];
      if (val !== '1' && val !== '2' && val !== '3') {
        exitWithError(`--night must be 1, 2, or 3, got '${val}'`);
      }
      night = parseInt(val, 10) as 1 | 2 | 3;
    } else if (arg === '--ticks') {
      const val = args[++i];
      if (val === undefined || isNaN(Number(val)) || Number(val) < 0) {
        exitWithError('Missing or invalid --ticks value');
      }
      ticks = parseInt(val, 10);
    } else if (arg === '--out') {
      const val = args[++i];
      if (!val) {
        exitWithError('Missing --out file path');
      }
      out = val;
    } else if (arg === '--snapshot-every') {
      const val = args[++i];
      if (val === undefined || isNaN(Number(val)) || Number(val) <= 0) {
        exitWithError('--snapshot-every must be a positive integer');
      }
      snapshotEvery = parseInt(val, 10);
    } else if (arg === '--scenario') {
      scenarioPath = args[++i];
      if (!scenarioPath) {
        exitWithError('Missing --scenario file path');
      }
    } else if (arg === '--inputs') {
      inputsPath = args[++i];
      if (!inputsPath) {
        exitWithError('Missing --inputs file path');
      }
    } else {
      exitWithError(`Unknown argument: ${arg}`);
    }
  }

  if (seed === undefined) exitWithError('--seed is required');
  if (night === undefined) exitWithError('--night is required');
  if (ticks === undefined) exitWithError('--ticks is required');
  if (out === undefined) exitWithError('--out is required');

  return {
    seed,
    night,
    ticks,
    out,
    snapshotEvery,
    scenarioPath,
    inputsPath,
  };
}

export function runCli(): void {
  try {
    const config = parseArgs(process.argv.slice(2));

    let scenarioData;
    if (config.scenarioPath) {
      try {
        scenarioData = parseScenarioFile(path.resolve(config.scenarioPath));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        exitWithError(`Scenario parse error: ${msg}`, 2);
      }
    }

    const inputParser = new InputParser();
    if (config.inputsPath) {
      try {
        inputParser.loadFile(path.resolve(config.inputsPath));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        exitWithError(`Inputs parse error: ${msg}`, 2);
      }
    }

    const timeline = inputParser.buildTimeline(config.ticks);
    const world = new World(config.seed, scenarioData, TUNING, config.night);

    const outDir = path.dirname(path.resolve(config.out));
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const writer = new JsonlWriter(path.resolve(config.out));

    // Contract v1.1 FR2-055: night_start tại tick 0 trước snapshot tick 0
    writer.writeEvent({
      type: 'event',
      tick: 0,
      name: 'night_start',
      data: { night: config.night },
    });

    // Tick 0 snapshot
    writer.writeSnapshot(world.getSnapshot());

    // Main simulation loop
    for (let k = 0; k < config.ticks; k++) {
      world.step(timeline[k]);

      // 1. Events for this step (trước snapshot)
      for (const ev of world.events) {
        writer.writeEvent(ev);
      }

      // 2. Bước 12: Snapshot nếu tới lượt
      if (world.tick % config.snapshotEvery === 0) {
        writer.writeSnapshot(world.getSnapshot());
      }

      // Dừng chỉ khi won hoặc lost (paused vẫn chạy tiếp tới đủ --ticks)
      if (world.state === 'won' || world.state === 'lost') {
        break;
      }
    }

    // End line
    writer.writeEnd({
      type: 'end',
      ticks: world.tick,
      state: world.state,
      score: world.score,
    });

    writer.close();
    process.exit(0);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    exitWithError(msg, 1);
  }
}

runCli();
