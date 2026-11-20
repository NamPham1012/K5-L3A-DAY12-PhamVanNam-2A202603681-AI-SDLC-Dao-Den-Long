import { Shade, Lantern, Vec3 } from './entities.js';

export function updateShadeChase(
  shade: Shade,
  playerPos: Vec3,
  speed: number,
  litLanterns: Lantern[],
  safeRadius: number
): void {
  if (shade.state === 'stunned') {
    shade.stun_timer -= 1 / 60;
    if (shade.stun_timer <= 0) {
      shade.state = 'chase';
      shade.stun_timer = 0;
    }
    return;
  }

  const dx = playerPos[0] - shade.pos[0];
  const dz = playerPos[2] - shade.pos[2];
  const dist = Math.sqrt(dx * dx + dz * dz);
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

  for (const lantern of litLanterns) {
    const lx = sx - lantern.pos[0];
    const lz = sz - lantern.pos[2];
    const lDist = Math.sqrt(lx * lx + lz * lz);
    if (lDist < safeRadius) {
      if (lDist > 0.0001) {
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
