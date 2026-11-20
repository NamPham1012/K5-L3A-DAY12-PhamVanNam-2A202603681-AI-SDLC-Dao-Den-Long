import { Player, Shade } from './entities.js';

const MAX_HEIGHT_DIFF = 1.5;

export function findHittingShade(
  player: Player,
  sortedShades: Shade[],
  hitRadius: number,
  currentSimTick: number
): Shade | null {
  if (player.invuln_ticks > 0 || player.fall_respawn_ticks > 0) {
    return null;
  }

  const hitRadiusSq = hitRadius * hitRadius;
  for (const shade of sortedShades) {
    if (shade.interactable_from_tick > currentSimTick) continue;
    if (shade.safe_push_ticks_left > 0) continue;
    if (shade.state !== 'chase' && shade.state !== 'wander') continue;

    const dx = player.pos[0] - shade.pos[0];
    const dz = player.pos[2] - shade.pos[2];
    const dy = Math.abs(player.pos[1] - shade.pos[1]);
    if (dx * dx + dz * dz <= hitRadiusSq && dy <= MAX_HEIGHT_DIFF) {
      return shade;
    }
  }
  return null;
}

export function applyShadeRecoil(shade: Shade, playerPos: [number, number, number]): void {
  const dx = shade.pos[0] - playerPos[0];
  const dz = shade.pos[2] - playerPos[2];
  const dist = Math.sqrt(dx * dx + dz * dz);
  let dirX = 1;
  let dirZ = 0;
  if (dist > 1e-4) {
    dirX = dx / dist;
    dirZ = dz / dist;
  }
  shade.state = 'recoil';
  shade.state_ticks_left = 60;
  shade.recoil_step = [(dirX * 2.0) / 60, (dirZ * 2.0) / 60];
}
