import { Player, Shade } from './entities.js';

export interface PulseResult {
  triggered: boolean;
  stunnedIds: string[];
}

export const PULSE_PUSH_TICKS = 15;

export function executePulse(
  player: Player,
  shades: Shade[],
  pulseRadius: number,
  pulseCost: number,
  pulseStunS: number,
  pulsePushM: number,
  pulseCooldownS: number,
  currentSimTick: number
): PulseResult {
  if (player.fall_respawn_ticks > 0) {
    return { triggered: false, stunnedIds: [] };
  }
  if (player.pulse_cd_ticks > 0 || player.carried < pulseCost) {
    return { triggered: false, stunnedIds: [] };
  }

  player.carried -= pulseCost;
  player.pulse_cd_ticks = Math.round(pulseCooldownS * 60); // 180 tick
  player.pulse_cooldown_timer = player.pulse_cd_ticks / 60;

  const stunTicks = Math.round(pulseStunS * 60); // 120 tick
  const pulseRadiusSq = pulseRadius * pulseRadius;
  const stunnedIds: string[] = [];

  // Tâm = chân Mây + (0, 0.8, 0)
  const centerX = player.pos[0];
  const centerY = player.pos[1] + 0.8;
  const centerZ = player.pos[2];

  const sortedShades = [...shades].sort((a, b) =>
    a.id.localeCompare(b.id, undefined, { numeric: true })
  );

  for (const shade of sortedShades) {
    if (shade.interactable_from_tick > currentSimTick || shade.state === 'spawning') {
      continue;
    }

    const dx = shade.pos[0] - centerX;
    const dy = shade.pos[1] - centerY;
    const dz = shade.pos[2] - centerZ;
    const dist3DSq = dx * dx + dy * dy + dz * dz;

    if (dist3DSq <= pulseRadiusSq) {
      shade.state = 'stunned';
      shade.state_ticks_left = stunTicks;
      shade.stun_timer = stunTicks / 60;
      stunnedIds.push(shade.id);

      // Đẩy lùi tổng 4m theo phương ngang trong 15 tick đầu; trùng vị trí đẩy theo +X
      const horizDist = Math.sqrt(dx * dx + dz * dz);
      let dirX = 1;
      let dirZ = 0;
      if (horizDist > 1e-4) {
        dirX = dx / horizDist;
        dirZ = dz / horizDist;
      }
      shade.push_ticks_left = PULSE_PUSH_TICKS;
      shade.push_step = [(dirX * pulsePushM) / PULSE_PUSH_TICKS, (dirZ * pulsePushM) / PULSE_PUSH_TICKS];
    }
  }

  return { triggered: true, stunnedIds };
}
