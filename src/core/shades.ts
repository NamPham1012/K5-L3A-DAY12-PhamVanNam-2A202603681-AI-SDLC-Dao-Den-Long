import { Shade, Lantern, Vec3 } from './entities.js';
import { NightMap } from './maps/night1.js';

const DETECT_RADIUS = 12.0;
const DROP_CHASE_RADIUS = 18.0;

/**
 * Bước 6: Cập nhật vùng an toàn.
 * Shade đang ở trong vùng 6m của đèn đã sáng sẽ được lập lịch đẩy ra mép trong tối đa 30 tick.
 */
export function updateShadeSafeZones(
  shades: Shade[],
  litLanterns: Lantern[],
  safeRadius: number,
  currentSimTick: number
): void {
  if (litLanterns.length === 0) return;

  for (const shade of shades) {
    if (shade.interactable_from_tick > currentSimTick || shade.state === 'spawning') {
      continue;
    }
    if (shade.safe_push_ticks_left > 0) continue;

    for (const lantern of litLanterns) {
      const lx = shade.pos[0] - lantern.pos[0];
      const lz = shade.pos[2] - lantern.pos[2];
      const lDist = Math.sqrt(lx * lx + lz * lz);
      if (lDist < safeRadius - 1e-4) {
        let dirX = 1;
        let dirZ = 0;
        if (lDist > 1e-4) {
          dirX = lx / lDist;
          dirZ = lz / lDist;
        }
        const need = safeRadius - lDist;
        const pushTicks = Math.min(30, Math.max(1, Math.ceil((need / safeRadius) * 30)));
        shade.safe_push_ticks_left = pushTicks;
        shade.safe_push_step = [(dirX * need) / pushTicks, (dirZ * need) / pushTicks];
        break;
      }
    }
  }
}

/**
 * Bước 8: Di chuyển Bóng Mực theo 5 trạng thái chuẩn Ticket-02.
 */
export function updateShadeMovement(
  shade: Shade,
  playerPos: Vec3,
  playerWaitingRespawn: boolean,
  speed: number,
  litLanterns: Lantern[],
  safeRadius: number,
  map: NightMap,
  currentSimTick: number,
  allLanterns: Lantern[]
): void {
  if (shade.interactable_from_tick > currentSimTick || shade.state === 'spawning') {
    return;
  }

  // 1. Đang bị đẩy ra khỏi vùng an toàn (tối đa 30 tick)
  if (shade.safe_push_ticks_left > 0) {
    shade.pos[0] += shade.safe_push_step[0];
    shade.pos[2] += shade.safe_push_step[1];
    shade.safe_push_ticks_left -= 1;
    return;
  }

  // 2. Đang bị choáng (stunned): trong 15 tick đầu bị đẩy lùi tổng 4m
  if (shade.state === 'stunned') {
    if (shade.push_ticks_left > 0) {
      const nextX = shade.pos[0] + shade.push_step[0];
      const nextZ = shade.pos[2] + shade.push_step[1];

      let blocked = map.isBlockedXZ(shade.pos[0], shade.pos[2], nextX, nextZ, shade.pos[1]);
      if (!blocked) {
        for (const lantern of litLanterns) {
          const lx = nextX - lantern.pos[0];
          const lz = nextZ - lantern.pos[2];
          if (lx * lx + lz * lz < safeRadius * safeRadius - 1e-4) {
            blocked = true;
            break;
          }
        }
      }

      if (blocked) {
        shade.push_ticks_left = 0;
      } else {
        shade.pos[0] = nextX;
        shade.pos[2] = nextZ;
        shade.push_ticks_left -= 1;
      }
    }
    return;
  }

  // 3. Đang recoil (lùi 2m trong 60 tick sau khi gây hit)
  if (shade.state === 'recoil') {
    let sx = shade.pos[0] + shade.recoil_step[0];
    let sz = shade.pos[2] + shade.recoil_step[1];
    if (!map.isBlockedXZ(shade.pos[0], shade.pos[2], sx, sz, shade.pos[1])) {
      for (const lantern of litLanterns) {
        const lx = sx - lantern.pos[0];
        const lz = sz - lantern.pos[2];
        const lDist = Math.sqrt(lx * lx + lz * lz);
        if (lDist < safeRadius) {
          if (lDist > 1e-4) {
            sx = lantern.pos[0] + (lx / lDist) * safeRadius;
            sz = lantern.pos[2] + (lz / lDist) * safeRadius;
          } else {
            sx = lantern.pos[0] + safeRadius;
          }
        }
      }
      shade.pos[0] = sx;
      shade.pos[2] = sz;
    }
    return;
  }

  // 4. Trạng thái wander / chase: cập nhật phát hiện (12m) và bỏ đuổi (18m)
  const dx = playerPos[0] - shade.pos[0];
  const dz = playerPos[2] - shade.pos[2];
  const dist = Math.sqrt(dx * dx + dz * dz);

  if (playerWaitingRespawn) {
    shade.state = 'wander';
    return;
  }

  if (shade.state === 'drain') {
    const target = allLanterns.find(l => l.id === shade.target_lantern_id);
    if (dist <= 6) shade.state = 'chase';
    else if (!target || !target.lit || target.fuel_u >= 1800 || Math.hypot(shade.pos[0] - target.pos[0], shade.pos[2] - target.pos[2]) > 2) shade.state = 'wander';
    else return;
    shade.drain_ticks = 0;
  }

  if (shade.state === 'wander' && dist <= DETECT_RADIUS) {
    shade.state = 'chase';
  } else if (shade.state === 'chase' && dist > DROP_CHASE_RADIUS) {
    shade.state = 'wander';
  }

  if (shade.state === 'wander') {
    const byDistance = (a: Lantern, b: Lantern) => Math.hypot(a.pos[0]-shade.pos[0], a.pos[2]-shade.pos[2]) - Math.hypot(b.pos[0]-shade.pos[0], b.pos[2]-shade.pos[2]) || a.id.localeCompare(b.id, undefined, {numeric:true});
    const weak = allLanterns.filter(l => l.lit && l.fuel_u < 1800).sort(byDistance);
    const target = weak[0] ?? allLanterns.filter(l => !l.lit).sort(byDistance)[0];
    if (!target) return;
    shade.target_lantern_id = target.id;
    const tx = target.pos[0] - shade.pos[0], tz = target.pos[2] - shade.pos[2];
    const distance = Math.hypot(tx, tz);
    if (distance <= 2) {
      if (target.lit && target.fuel_u < 1800) { shade.state = 'drain'; shade.drain_ticks = 0; }
      return;
    }
    const move = Math.min(2 / 60, distance - 2);
    const x = shade.pos[0] + tx / distance * move, z = shade.pos[2] + tz / distance * move;
    if (!map.isBlockedXZ(shade.pos[0], shade.pos[2], x, z, shade.pos[1]) && !litLanterns.some(l => Math.hypot(x-l.pos[0], z-l.pos[2]) < safeRadius)) { shade.pos[0] = x; shade.pos[2] = z; }
    if (target.lit && target.fuel_u < 1800 && Math.hypot(target.pos[0]-shade.pos[0], target.pos[2]-shade.pos[2]) <= 2 + 1e-9) { shade.state = 'drain'; shade.drain_ticks = 0; }
    return;
  }
  if (shade.state !== 'chase') {
    return;
  }

  const stepDist = speed / 60;
  let sx = shade.pos[0];
  let sz = shade.pos[2];

  if (dist > stepDist) {
    sx += (dx / dist) * stepDist;
    sz += (dz / dist) * stepDist;
  } else {
    sx = playerPos[0];
    sz = playerPos[2];
  }

  // Chặn ở mép 6m của mọi đèn đã sáng
  for (const lantern of litLanterns) {
    const lx = sx - lantern.pos[0];
    const lz = sz - lantern.pos[2];
    const lDist = Math.sqrt(lx * lx + lz * lz);
    if (lDist < safeRadius) {
      if (lDist > 1e-4) {
        sx = lantern.pos[0] + (lx / lDist) * safeRadius;
        sz = lantern.pos[2] + (lz / lDist) * safeRadius;
      } else {
        sx = lantern.pos[0] + safeRadius;
      }
    }
  }

  shade.pos[0] = sx;
  shade.pos[2] = sz;
}
