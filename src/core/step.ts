import { World, round3 } from './world.js';
import { InputState } from './entities.js';
import { findBestLanternToDeposit } from './lanterns.js';
import { executePulse } from './pulse.js';
import { updateShadeChase } from './shades.js';
import { checkPlayerHit } from './damage.js';
import { generateDroppedMotes } from './motes.js';

export function stepWorld(world: World, input: InputState): void {
  if (world.state !== 'playing') {
    return;
  }

  const nextTick = world.tick + 1;
  world.events = [];
  const tuning = world.tuning;
  const player = world.player;

  // 1) Áp frame input của tick k, tính cạnh lên
  const jumpEdge = input.jump && !player.prevButtons.jump;
  const interactEdge = input.interact && !player.prevButtons.interact;
  const pulseEdge = input.pulse && !player.prevButtons.pulse;
  player.prevButtons = {
    jump: input.jump,
    interact: input.interact,
    pulse: input.pulse,
  };

  // 2) Di chuyển / nhảy người chơi, chặn mép đảo 40m
  const theta = (input.cam_yaw_deg * Math.PI) / 180;
  const mx = input.move[0];
  const mz = input.move[1];

  const worldDirX = mx * Math.cos(theta) + mz * Math.sin(theta);
  const worldDirZ = -mx * Math.sin(theta) + mz * Math.cos(theta);

  const speedPerTick = tuning.player_speed / 60;
  let newX = player.pos[0] + worldDirX * speedPerTick;
  let newZ = player.pos[2] + worldDirZ * speedPerTick;

  const distSq = newX * newX + newZ * newZ;
  if (distSq > 1600) {
    const dist = Math.sqrt(distSq);
    newX = (newX / dist) * 40;
    newZ = (newZ / dist) * 40;
  }

  if (jumpEdge && player.pos[1] <= 0) {
    player.velY = 5.0;
  }
  player.velY -= 9.8 / 60;
  let newY = player.pos[1] + player.velY / 60;
  if (newY <= 0) {
    newY = 0;
    player.velY = 0;
  }
  player.pos = [newX, newY, newZ];

  // 3) Nhặt đom đóm (sắp theo ID tăng dần)
  const pickupRadiusSq = tuning.pickup_radius * tuning.pickup_radius;
  const sortedMotes = [...world.motes].sort((a, b) =>
    a.id.localeCompare(b.id, undefined, { numeric: true })
  );

  for (const mote of sortedMotes) {
    if (!mote.active) continue;
    if (player.carried >= tuning.carry_capacity) break;

    const dx = player.pos[0] - mote.pos[0];
    const dz = player.pos[2] - mote.pos[2];
    if (dx * dx + dz * dz <= pickupRadiusSq) {
      mote.active = false;
      player.carried++;
      world.score += tuning.score.per_mote;
      world.events.push({
        type: 'event',
        tick: nextTick,
        name: 'mote_picked',
        data: { carried: player.carried },
      });
    }
  }

  // 4) Interact / nạp / thắp
  if (interactEdge && player.carried > 0) {
    const target = findBestLanternToDeposit(player.pos, world.lanterns, tuning.interact_radius);
    if (target) {
      const needed = tuning.lantern_cost - target.deposited;
      const amount = Math.min(player.carried, needed);

      if (amount > 0) {
        player.carried -= amount;
        target.deposited += amount;
        world.events.push({
          type: 'event',
          tick: nextTick,
          name: 'deposit',
          data: {
            lantern_id: target.id,
            amount,
            deposited: target.deposited,
          },
        });

        if (target.deposited >= tuning.lantern_cost) {
          target.lit = true;
          world.score += tuning.score.per_lantern;
          world.events.push({
            type: 'event',
            tick: nextTick,
            name: 'lantern_lit',
            data: { lantern_id: target.id },
          });
        }
      }
    }
  }

  // 5) Pulse
  if (pulseEdge) {
    const pulseRes = executePulse(
      player,
      world.shades,
      tuning.pulse_radius,
      tuning.pulse_cost,
      tuning.pulse_stun_s,
      tuning.pulse_push_m,
      tuning.pulse_cooldown_s
    );

    if (pulseRes.triggered) {
      world.score += tuning.score.per_stun * pulseRes.stunnedIds.length;
      world.events.push({
        type: 'event',
        tick: nextTick,
        name: 'pulse',
        data: { stunned_ids: pulseRes.stunnedIds },
      });
    }
  }

  // 6) Cập nhật shade (giảm thời gian choáng, đuổi theo, tôn trọng safe_radius)
  const sortedShadesForUpdate = [...world.shades].sort((a, b) =>
    a.id.localeCompare(b.id, undefined, { numeric: true })
  );
  const litLanterns = world.lanterns.filter((l) => l.lit);

  for (const shade of sortedShadesForUpdate) {
    updateShadeChase(shade, player.pos, tuning.shade_speed, litLanterns, tuning.safe_radius);
  }

  // 7) Va chạm shade -> người chơi
  const hit = checkPlayerHit(player, sortedShadesForUpdate, tuning.shade_hit_radius);
  if (hit) {
    player.flames -= 1;
    const dropped = Math.floor(player.carried * tuning.hit_drop_ratio);
    player.carried -= dropped;
    player.invuln_timer = tuning.invuln_s;

    world.events.push({
      type: 'event',
      tick: nextTick,
      name: 'player_hit',
      data: {
        by: 'shade',
        flames: player.flames,
        dropped,
      },
    });

    if (dropped > 0) {
      const dropRes = generateDroppedMotes(player.pos, dropped, world.moteCounter, world.rng);
      world.motes.push(...dropRes.motes);
      world.moteCounter = dropRes.nextCounter;
    }
  }

  // 8) Giảm bộ đếm bất tử / hồi chiêu, sinh shade/đom đóm theo lịch
  if (player.invuln_timer > 0) {
    player.invuln_timer = Math.max(0, player.invuln_timer - 1 / 60);
  }
  if (player.pulse_cooldown_timer > 0) {
    player.pulse_cooldown_timer = Math.max(0, player.pulse_cooldown_timer - 1 / 60);
  }

  // Lịch sinh đom đóm bù: mỗi 120 tick
  if (world.random_motes && nextTick % 120 === 0) {
    let needed = 0;
    for (const lantern of world.lanterns) {
      if (!lantern.lit) {
        needed += tuning.lantern_cost - lantern.deposited;
      }
    }
    const available = world.motes.filter((m) => m.active).length + player.carried;

    if (available < needed) {
      let placed = false;
      for (let attempt = 0; attempt < 20; attempt++) {
        const angle = world.rng.nextFloat(0, Math.PI * 2);
        const radius = Math.sqrt(world.rng.next()) * 38;
        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);

        if (x * x + z * z < 9) continue;
        let validLantern = true;
        for (const lantern of world.lanterns) {
          const lx = x - lantern.pos[0];
          const lz = z - lantern.pos[2];
          if (lx * lx + lz * lz < 9) {
            validLantern = false;
            break;
          }
        }
        if (validLantern) {
          world.motes.push({
            id: `M${world.moteCounter++}`,
            pos: [round3(x), 0, round3(z)],
            active: true,
          });
          placed = true;
          break;
        }
      }
      if (!placed) {
        world.motes.push({
          id: `M${world.moteCounter++}`,
          pos: [35, 0, 0],
          active: true,
        });
      }
    }
  }

  // Lịch sinh shade: mỗi 30s (tick 1800, 3600...)
  if (world.random_shades && nextTick % 1800 === 0) {
    if (world.shades.length < 6) {
      const pos = world.findShadeSpawnPos();
      const newShade = {
        id: `S${world.shadeCounter++}`,
        pos,
        state: 'chase' as const,
        stun_timer: 0,
      };
      world.shades.push(newShade);
      world.events.push({
        type: 'event',
        tick: nextTick,
        name: 'shade_spawned',
        data: { id: newShade.id },
      });
    }
  }

  // 9) Cập nhật time_left_s
  world.time_left_s = world.initial_duration_s - nextTick / 60;

  // 10) Kiểm tra kết thúc: ưu tiên won > no_flames > dawn
  const allLit = world.lanterns.every((l) => l.lit);
  const noFlames = player.flames <= 0;
  const dawn = world.time_left_s <= 0;

  if (allLit) {
    world.state = 'won';
    const bonus =
      Math.floor(Math.max(0, world.time_left_s)) * tuning.score.per_second_left +
      player.flames * tuning.score.per_flame_left;
    world.score += bonus;
    world.events.push({
      type: 'event',
      tick: nextTick,
      name: 'game_over',
      data: { result: 'won', reason: 'all_lit' },
    });
  } else if (noFlames) {
    world.state = 'lost';
    world.events.push({
      type: 'event',
      tick: nextTick,
      name: 'game_over',
      data: { result: 'lost', reason: 'no_flames' },
    });
  } else if (dawn) {
    world.state = 'lost';
    world.events.push({
      type: 'event',
      tick: nextTick,
      name: 'game_over',
      data: { result: 'lost', reason: 'dawn' },
    });
  }

  world.tick = nextTick;
  world.sim_tick = nextTick;
}
