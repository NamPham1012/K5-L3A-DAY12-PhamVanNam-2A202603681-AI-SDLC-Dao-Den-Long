import { Mote, Vec3 } from './entities.js';
import { round3 } from './world.js';
import { PRNG } from './rng.js';

export function createMote(id: string, pos: Vec3): Mote {
  return {
    id,
    pos: [round3(pos[0]), 0, round3(pos[2])],
    active: true,
  };
}

export function generateDroppedMotes(
  playerPos: Vec3,
  droppedCount: number,
  startCounter: number,
  rng: PRNG
): { motes: Mote[]; nextCounter: number } {
  const result: Mote[] = [];
  let counter = startCounter;
  if (droppedCount <= 0) return { motes: result, nextCounter: counter };

  const baseAngle = rng.nextFloat(0, Math.PI * 2);
  const angleStep = (Math.PI * 2) / droppedCount;

  for (let i = 0; i < droppedCount; i++) {
    const ang = baseAngle + i * angleStep;
    let mx = playerPos[0] + 3.0 * Math.cos(ang);
    let mz = playerPos[2] + 3.0 * Math.sin(ang);
    const mDist = Math.sqrt(mx * mx + mz * mz);
    if (mDist > 40) {
      mx = (mx / mDist) * 39.9;
      mz = (mz / mDist) * 39.9;
    }
    result.push({
      id: `M${counter++}`,
      pos: [round3(mx), 0, round3(mz)],
      active: true,
    });
  }

  return { motes: result, nextCounter: counter };
}
