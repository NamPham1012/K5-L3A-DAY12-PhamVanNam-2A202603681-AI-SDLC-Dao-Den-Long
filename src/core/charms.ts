import { World } from './world.js';

export const CHARM_DURATION_TICKS = 600;
export const CHARM_RESPAWN_TICKS = 2700;

export function checkCharmPickups(world: World, eventTick: number): void {
  const player = world.player;
  if (player.fall_respawn_ticks > 0) return;

  const pickupRadiusSq = world.tuning.pickup_radius * world.tuning.pickup_radius;
  const sortedCharms = [...world.charms].sort((a, b) =>
    a.id.localeCompare(b.id, undefined, { numeric: true })
  );

  for (const charm of sortedCharms) {
    if (!charm.available) continue;

    const dx = player.pos[0] - charm.pos[0];
    const dz = player.pos[2] - charm.pos[2];
    const dy = Math.abs(player.pos[1] - charm.pos[1]);

    if (dx * dx + dz * dz <= pickupRadiusSq && dy <= 1.5) {
      charm.available = false;
      charm.respawn_ticks = CHARM_RESPAWN_TICKS;
      player.charm_ticks = CHARM_DURATION_TICKS;

      world.events.push({
        type: 'event',
        tick: eventTick,
        name: 'charm_picked',
        data: {
          charm_id: charm.id,
          charm_ticks: CHARM_DURATION_TICKS,
        },
      });
    }
  }
}
