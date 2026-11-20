import fs from 'node:fs';
import { performance } from 'node:perf_hooks';
import { World } from '../core/world.js';
import { PRNG } from '../core/rng.js';
import { TUNING } from '../core/tuning.js';

function argument(name: string): string {
  const index = process.argv.indexOf(name);
  if (index < 0 || !process.argv[index + 1]) throw new Error(`Missing ${name}`);
  return process.argv[index + 1];
}
function rss(): number { global.gc?.(); return process.memoryUsage().rss / 1048576; }

try {
  const seed = Number(argument('--seed'));
  const nights = Number(argument('--nights'));
  const output = argument('--out');
  if (!Number.isInteger(seed) || !Number.isInteger(nights) || nights < 1) throw new Error('Invalid seed or nights');
  const start = performance.now();
  const results: string[] = [];
  let crashes = 0, startMemory = 0, endMemory = 0;
  let world: World | null = null;
  for (let i = 0; i < nights; i++) {
    try {
      const night = (i % 3 + 1) as 1 | 2 | 3;
      world = new World(seed + i, undefined, TUNING, night);
      const rng = new PRNG(seed + i);
      if (i === 0) startMemory = rss();
      let move: [number, number] = [0, 0];
      let previous = { jump:false, dash:false, pulse:false, interact:false };
      const limit = Math.round(world.initial_duration_s * 60);
      for (let tick = 0; tick < limit && world.state === 'playing'; tick++) {
        if (tick % 30 === 0) { const a = rng.next() * 2 * Math.PI; move = [Math.cos(a), Math.sin(a)]; }
        const input = { move, cam_yaw_deg:0,
          jump: !previous.jump && rng.next() < 0.05,
          dash: !previous.dash && rng.next() < 0.03,
          pulse: !previous.pulse && rng.next() < 0.02,
          interact: !previous.interact && rng.next() < 0.10 };
        world.step(input); previous = input;
      }
      results.push(world.state);
      world = null;
    } catch (error) {
      crashes++; results.push('crash'); world = null;
      console.error(`Night ${i + 1} failed:`, error);
    }
  }
  endMemory = rss();
  fs.writeFileSync(output, JSON.stringify({nights, crashes, results, mem_start_mb:startMemory, mem_end_mb:endMemory, duration_s:(performance.now()-start)/1000}, null, 2) + '\n');
} catch (error) { console.error(error); process.exitCode = 2; }
