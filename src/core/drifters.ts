import { Drifter, Player, Vec3 } from './entities.js';
import { World } from './world.js';
import { generateDroppedMotes } from './motes.js';

const DRIFTER_IDLE_SPEED = 2.0;
const DRIFTER_IDLE_RADIUS = 3.0;
const DRIFTER_FAST_SPEED = 7.0;
const DRIFTER_DETECT_RADIUS = 15.0;
const DRIFTER_STEAL_RADIUS = 1.2;
const DRIFTER_FLEE_TICKS = 240;
const DRIFTER_DROP_FLEE_TICKS = 120;
const MAX_ACTIVE_DRIFTERS = 2;

export function tickDrifterTimers(drifters: Drifter[]): void {
  for (const d of drifters) {
    if (d.state === 'flee' && d.timer_ticks > 0) {
      d.timer_ticks -= 1;
      if (d.timer_ticks === 0) {
        d.state = 'removed';
      }
    }
  }
}

export function applyPulseToDrifters(
  world: World,
  pulseRadius: number,
  currentSimTick: number,
  eventTick: number
): void {
  const player = world.player;
  const centerX = player.pos[0];
  const centerY = player.pos[1] + 0.8;
  const centerZ = player.pos[2];
  const radiusSq = pulseRadius * pulseRadius;

  const sorted = [...world.drifters].sort((a, b) =>
    a.id.localeCompare(b.id, undefined, { numeric: true })
  );

  for (const d of sorted) {
    if (d.state === 'removed' || d.interactable_from_tick > currentSimTick) continue;

    const dx = d.pos[0] - centerX;
    const dy = d.pos[1] - centerY;
    const dz = d.pos[2] - centerZ;
    if (dx * dx + dy * dy + dz * dz > radiusSq) continue;

    if (d.state === 'chase') {
      d.state = 'flee';
      d.timer_ticks = DRIFTER_FLEE_TICKS;
    } else if (d.state === 'flee' && d.stolen > 0) {
      const amount = d.stolen;
      d.stolen = 0;
      d.timer_ticks = DRIFTER_DROP_FLEE_TICKS;

      const dropOrigin: Vec3 = [d.pos[0], Math.max(0, d.pos[1] - 1.5), d.pos[2]];
      const dropRes = generateDroppedMotes(
        dropOrigin,
        amount,
        world.moteCounter,
        world.rng,
        currentSimTick + 1,
        0.0,
        0.5
      );
      world.motes.push(...dropRes.motes);
      world.moteCounter = dropRes.nextCounter;

      world.events.push({
        type: 'event',
        tick: eventTick,
        name: 'drifter_drop',
        data: {
          drifter_id: d.id,
          amount,
        },
      });
    }
  }
}

export function updateDriftersMovement(
  drifters: Drifter[],
  player: Player,
  currentSimTick: number
): void {
  const sorted = [...drifters].sort((a, b) =>
    a.id.localeCompare(b.id, undefined, { numeric: true })
  );

  for (const d of sorted) {
    if (d.state === 'removed' || d.interactable_from_tick > currentSimTick) continue;

    if (d.state === 'flee') {
      const dx = d.pos[0] - player.pos[0];
      const dz = d.pos[2] - player.pos[2];
      const dist = Math.sqrt(dx * dx + dz * dz);
      const stepDist = DRIFTER_FAST_SPEED / 60;
      let dirX = 1;
      let dirZ = 0;
      if (dist > 1e-4) {
        dirX = dx / dist;
        dirZ = dz / dist;
      }
      d.pos[0] += dirX * stepDist;
      d.pos[2] += dirZ * stepDist;
      continue;
    }

    // Kiểm tra điều kiện chase <-> idle mỗi tick
    const dx = player.pos[0] - d.pos[0];
    const dz = player.pos[2] - d.pos[2];
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (
      player.fall_respawn_ticks === 0 &&
      !d.stolen_once &&
      player.carried >= 5 &&
      dist <= DRIFTER_DETECT_RADIUS
    ) {
      d.state = 'chase';
    } else {
      d.state = 'idle';
    }

    if (d.state === 'chase') {
      const stepDist = DRIFTER_FAST_SPEED / 60;
      if (dist > stepDist) {
        d.pos[0] += (dx / dist) * stepDist;
        d.pos[2] += (dz / dist) * stepDist;
      } else {
        d.pos[0] = player.pos[0];
        d.pos[2] = player.pos[2];
      }
    } else {
      // idle: lượn tròn bán kính 3m quanh spawn_pos ở 2 m/s
      const angle = (currentSimTick / 60) * (DRIFTER_IDLE_SPEED / DRIFTER_IDLE_RADIUS);
      d.pos[0] = d.spawn_pos[0] + DRIFTER_IDLE_RADIUS * Math.cos(angle);
      d.pos[2] = d.spawn_pos[2] + DRIFTER_IDLE_RADIUS * Math.sin(angle);
    }
  }
}

export function checkDrifterSteals(
  world: World,
  currentSimTick: number,
  eventTick: number
): void {
  const player = world.player;
  if (player.fall_respawn_ticks > 0 || player.carried <= 0) return;

  const stealRadiusSq = DRIFTER_STEAL_RADIUS * DRIFTER_STEAL_RADIUS;
  const sorted = [...world.drifters].sort((a, b) =>
    a.id.localeCompare(b.id, undefined, { numeric: true })
  );

  for (const d of sorted) {
    if (d.interactable_from_tick > currentSimTick) continue;
    if (d.stolen_once || d.state === 'flee' || d.state === 'removed') continue;

    const dx = player.pos[0] - d.pos[0];
    const dz = player.pos[2] - d.pos[2];
    if (dx * dx + dz * dz <= stealRadiusSq && player.carried > 0) {
      const amount = Math.min(3, player.carried);
      player.carried -= amount;
      d.stolen = amount;
      d.stolen_once = true;
      d.state = 'flee';
      d.timer_ticks = DRIFTER_FLEE_TICKS;

      world.events.push({
        type: 'event',
        tick: eventTick,
        name: 'drifter_steal',
        data: {
          drifter_id: d.id,
          amount,
          carried: player.carried,
        },
      });
    }
  }
}

export function trySpawnDrifter(world: World, currentSimTick: number): void {
  if (!world.random_drifters) return;
  if (world.night !== 2 && world.night !== 3) return;
  if (currentSimTick <= 0 || currentSimTick % 1200 !== 0) return;

  const activeCount = world.drifters.filter((d) => d.state !== 'removed').length;
  if (activeCount >= MAX_ACTIVE_DRIFTERS) return;
  if (world.map.shadeSpawnPoints.length === 0) return;

  const pick = world.rng.nextInt(0, world.map.shadeSpawnPoints.length - 1);
  const pt = world.map.shadeSpawnPoints[pick];
  const spawnPos: Vec3 = [pt[0], pt[1] + 1.5, pt[2]];

  world.drifters.push({
    id: `D${world.drifterCounter++}`,
    pos: [spawnPos[0], spawnPos[1], spawnPos[2]],
    state: 'idle',
    stolen: 0,
    stolen_once: false,
    timer_ticks: 0,
    spawn_pos: spawnPos,
    interactable_from_tick: currentSimTick + 1,
  });
}
