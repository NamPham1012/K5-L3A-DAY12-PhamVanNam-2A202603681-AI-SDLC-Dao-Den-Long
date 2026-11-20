import { Player, Shade } from './entities.js';

export function checkPlayerHit(
  player: Player,
  shades: Shade[],
  hitRadius: number
): boolean {
  if (player.invuln_timer > 0) return false;

  const hitRadiusSq = hitRadius * hitRadius;
  for (const shade of shades) {
    if (shade.state !== 'chase') continue;
    const dx = player.pos[0] - shade.pos[0];
    const dz = player.pos[2] - shade.pos[2];
    if (dx * dx + dz * dz <= hitRadiusSq) {
      return true;
    }
  }
  return false;
}
