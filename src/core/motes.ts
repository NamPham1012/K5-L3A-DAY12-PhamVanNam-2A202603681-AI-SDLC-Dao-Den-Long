import { Mote, Vec3 } from './entities.js';
import { PRNG } from './rng.js';
import { NightMap } from './maps/night1.js';

export const DROPPED_MOTE_TTL_TICKS = 480;
export const MAX_RANDOM_MOTES = 30;

export function generateDroppedMotes(
  originPos: Vec3,
  droppedCount: number,
  startCounter: number,
  rng: PRNG,
  interactableFromTick: number,
  minRadius: number = 1.5,
  maxRadius: number = 2.5
): { motes: Mote[]; nextCounter: number } {
  const result: Mote[] = [];
  let counter = startCounter;
  if (droppedCount <= 0) return { motes: result, nextCounter: counter };

  for (let i = 0; i < droppedCount; i++) {
    const r = rng.nextFloat(minRadius, maxRadius);
    const ang = rng.nextFloat(0, Math.PI * 2);
    const mx = originPos[0] + r * Math.cos(ang);
    const mz = originPos[2] + r * Math.sin(ang);
    result.push({
      id: `M${counter++}`,
      pos: [mx, originPos[1], mz],
      active: true,
      kind: 'dropped',
      ttl_ticks: DROPPED_MOTE_TTL_TICKS,
      spawn_point_idx: null,
      interactable_from_tick: interactableFromTick,
    });
  }

  return { motes: result, nextCounter: counter };
}

export function spawnRandomMoteOnEmptyPoint(
  motes: Mote[],
  map: NightMap,
  moteCounter: number,
  rng: PRNG,
  interactableFromTick: number
): { spawned: Mote | null; nextCounter: number } {
  const activeRandom = motes.filter((m) => m.active && m.kind === 'random');
  if (activeRandom.length >= MAX_RANDOM_MOTES) {
    return { spawned: null, nextCounter: moteCounter };
  }

  const occupied = new Set<number>();
  for (const m of activeRandom) {
    if (m.spawn_point_idx !== null) {
      occupied.add(m.spawn_point_idx);
    } else {
      // Kiểm tra khoảng cách nhỏ với điểm sinh cố định nếu mote từ scenario
      for (let idx = 0; idx < map.moteSpawnPoints.length; idx++) {
        const pt = map.moteSpawnPoints[idx];
        const dx = m.pos[0] - pt[0];
        const dz = m.pos[2] - pt[2];
        if (dx * dx + dz * dz < 0.01) {
          occupied.add(idx);
          break;
        }
      }
    }
  }

  const freeIndices: number[] = [];
  for (let idx = 0; idx < map.moteSpawnPoints.length; idx++) {
    if (!occupied.has(idx)) {
      freeIndices.push(idx);
    }
  }

  if (freeIndices.length === 0) {
    return { spawned: null, nextCounter: moteCounter };
  }

  const pick = rng.nextInt(0, freeIndices.length - 1);
  const ptIdx = freeIndices[pick];
  const pt = map.moteSpawnPoints[ptIdx];

  const mote: Mote = {
    id: `M${moteCounter}`,
    pos: [pt[0], pt[1], pt[2]],
    active: true,
    kind: 'random',
    ttl_ticks: null,
    spawn_point_idx: ptIdx,
    interactable_from_tick: interactableFromTick,
  };

  return { spawned: mote, nextCounter: moteCounter + 1 };
}
