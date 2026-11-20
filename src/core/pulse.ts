import { Player, Shade, Vec3 } from './entities.js';

export interface PulseResult {
  triggered: boolean;
  stunnedIds: string[];
}

export function executePulse(
  player: Player,
  shades: Shade[],
  pulseRadius: number,
  pulseCost: number,
  pulseStunS: number,
  pulsePushM: number,
  pulseCooldownS: number
): PulseResult {
  if (player.pulse_cooldown_timer > 0 || player.carried < pulseCost) {
    return { triggered: false, stunnedIds: [] };
  }

  player.carried -= pulseCost;
  player.pulse_cooldown_timer = pulseCooldownS;

  const pulseRadiusSq = pulseRadius * pulseRadius;
  const stunnedIds: string[] = [];

  const sortedShades = [...shades].sort((a, b) =>
    a.id.localeCompare(b.id, undefined, { numeric: true })
  );

  for (const shade of sortedShades) {
    const dx = shade.pos[0] - player.pos[0];
    const dz = shade.pos[2] - player.pos[2];
    const distSq = dx * dx + dz * dz;

    if (distSq <= pulseRadiusSq) {
      shade.state = 'stunned';
      shade.stun_timer = pulseStunS;
      stunnedIds.push(shade.id);

      const dist = Math.sqrt(distSq);
      let dirX = 1;
      let dirZ = 0;
      if (dist > 0.0001) {
        dirX = dx / dist;
        dirZ = dz / dist;
      }
      shade.pos[0] += dirX * pulsePushM;
      shade.pos[2] += dirZ * pulsePushM;
    }
  }

  return { triggered: true, stunnedIds };
}
