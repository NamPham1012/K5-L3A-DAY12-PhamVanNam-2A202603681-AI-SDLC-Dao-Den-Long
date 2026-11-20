import { World } from './world.js';
import { InputState, Shade } from './entities.js';
import { handlePauseEdge } from './pause.js';
import { stepPlayerPhysics } from './physics.js';
import { findBestLanternToDeposit } from './lanterns.js';
import { executePulse } from './pulse.js';
import { updateShadeSafeZones, updateShadeMovement } from './shades.js';
import { findHittingShade, applyShadeRecoil } from './damage.js';
import { generateDroppedMotes, spawnRandomMoteOnEmptyPoint } from './motes.js';
import {
  tickDrifterTimers,
  applyPulseToDrifters,
  updateDriftersMovement,
  checkDrifterSteals,
  trySpawnDrifter,
} from './drifters.js';
import { checkCharmPickups } from './charms.js';

export function stepWorld(world: World, input: InputState): void {
  if (world.state === 'won' || world.state === 'lost') {
    return;
  }

  const nextTick = world.tick + 1;
  world.events = [];
  const tuning = world.tuning;
  const player = world.player;

  // =========================================================================
  // BƯỚC 1: Đọc input (xử lý pause trước; nếu vừa tạm dừng thì dừng ở đây)
  // =========================================================================
  const jumpIn = Boolean(input.jump);
  const interactIn = Boolean(input.interact);
  const pulseIn = Boolean(input.pulse);
  const dashIn = Boolean(input.dash);
  const pauseIn = Boolean(input.pause);

  const jumpEdge = jumpIn && !player.prevButtons.jump;
  const interactEdge = interactIn && !player.prevButtons.interact;
  const pulseEdge = pulseIn && !player.prevButtons.pulse;
  const dashEdge = dashIn && !player.prevButtons.dash;
  const pauseEdge = pauseIn && !player.prevButtons.pause;

  player.prevButtons = {
    jump: jumpIn,
    interact: interactIn,
    pulse: pulseIn,
    dash: dashIn,
    pause: pauseIn,
  };

  if (handlePauseEdge(world, pauseEdge, nextTick)) {
    return;
  }

  // =========================================================================
  // BƯỚC 2: Giảm các bộ đếm (thời gian, hồi chiêu, bất tử, choáng, bùa, TTL, hồi bùa, gió, hồi sinh)
  // =========================================================================
  const nextSimTick = world.sim_tick + 1;
  world.time_left_s = world.initial_duration_s - nextSimTick / 60;

  if (player.dash_cd_ticks > 0) player.dash_cd_ticks -= 1;
  if (player.pulse_cd_ticks > 0) player.pulse_cd_ticks -= 1;
  player.pulse_cooldown_timer = player.pulse_cd_ticks / 60;

  if (player.invuln_ticks > 0) player.invuln_ticks -= 1;
  player.invuln_timer = player.invuln_ticks / 60;

  if (player.charm_ticks > 0) player.charm_ticks -= 1;

  // Chờ hồi sinh sau rơi khỏi đảo (60 tick -> hồi sinh ở startPos, vận tốc 0, bất tử 90 tick)
  if (player.fall_respawn_ticks > 0) {
    player.fall_respawn_ticks -= 1;
    if (player.fall_respawn_ticks === 0) {
      player.pos = [world.map.startPos[0], world.map.startPos[1], world.map.startPos[2]];
      player.vel = [0, 0, 0];
      player.velY = 0;
      player.grounded = true;
      player.facing = [world.map.startFacing[0], world.map.startFacing[1]];
      player.launch_vel = null;
      player.invuln_ticks = Math.round(tuning.invuln_s * 60); // 90 tick
      player.invuln_timer = player.invuln_ticks / 60;
    }
  }

  // Giảm bộ đếm trạng thái của Bóng Mực
  for (const shade of world.shades) {
    if (shade.state_ticks_left > 0) {
      shade.state_ticks_left -= 1;
      if (shade.state_ticks_left === 0) {
        if (shade.state === 'spawning' || shade.state === 'stunned' || shade.state === 'recoil') {
          shade.state = 'wander';
          shade.push_ticks_left = 0;
        }
      }
    }
    shade.stun_timer = shade.state === 'stunned' ? shade.state_ticks_left / 60 : 0;
  }

  // Giảm bộ đếm flee của Gió Lạc
  tickDrifterTimers(world.drifters);

  // Giảm TTL đom đóm rơi
  for (const mote of world.motes) {
    if (!mote.active || mote.ttl_ticks === null) continue;
    mote.ttl_ticks -= 1;
    if (mote.ttl_ticks <= 0) {
      mote.active = false;
    }
  }

  // Giảm thời gian hồi sinh Bùa Gió
  for (const charm of world.charms) {
    if (!charm.available && charm.respawn_ticks > 0) {
      charm.respawn_ticks -= 1;
      if (charm.respawn_ticks === 0) {
        charm.available = true;
      }
    }
  }

  // Cập nhật gió mạnh Đêm 3 (bắt đầu tại 1800k, kéo dài 300 tick)
  if (world.wind.active && world.wind.ticks_left > 0) {
    world.wind.ticks_left -= 1;
    if (world.wind.ticks_left === 0) {
      world.wind.active = false;
    }
  }
  if (world.night === 3 && world.wind_enabled && nextSimTick > 0 && nextSimTick % 1800 === 0) {
    world.wind.active = true;
    world.wind.dir_deg = world.rng.nextFloat(0, 360);
    world.wind.ticks_left = 300;
  }

  // =========================================================================
  // BƯỚC 3: Di chuyển Mây (nhảy, lướt, bục nhảy, gió) rồi kiểm tra rơi khỏi đảo
  // =========================================================================
  stepPlayerPhysics(world, input, { jumpEdge, dashEdge }, nextTick);

  // =========================================================================
  // BƯỚC 4: Nhặt đom đóm và bùa (bỏ qua nếu đang chờ hồi sinh)
  // =========================================================================
  if (player.fall_respawn_ticks === 0) {
    const pickupRadiusSq = tuning.pickup_radius * tuning.pickup_radius;
    const sortedMotes = [...world.motes].sort((a, b) =>
      a.id.localeCompare(b.id, undefined, { numeric: true })
    );

    for (const mote of sortedMotes) {
      if (!mote.active) continue;
      if (mote.interactable_from_tick > nextSimTick) continue;
      if (player.carried >= tuning.carry_capacity) break;

      const dx = player.pos[0] - mote.pos[0];
      const dz = player.pos[2] - mote.pos[2];
      const dy = Math.abs(player.pos[1] - mote.pos[1]);
      if (dx * dx + dz * dz <= pickupRadiusSq && dy <= 1.5) {
        mote.active = false;
        player.carried += 1;
        world.events.push({
          type: 'event',
          tick: nextTick,
          name: 'mote_picked',
          data: { carried: player.carried },
        });
      }
    }

    checkCharmPickups(world, nextTick);
  }

  // =========================================================================
  // BƯỚC 5: Tương tác với đèn
  // =========================================================================
  if (player.fall_respawn_ticks === 0 && interactEdge && player.carried > 0) {
    const target = findBestLanternToDeposit(player.pos, world.lanterns, tuning.interact_radius);
    if (target) {
      const needed = tuning.lantern_cost - target.deposited;
      const amount = Math.min(player.carried, needed);

      if (amount > 0) {
        player.carried -= amount;
        target.deposited += amount;
        world.score += amount * tuning.score.per_mote;

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

  // =========================================================================
  // BƯỚC 6: Cập nhật vùng an toàn
  // =========================================================================
  const litLanterns = world.lanterns.filter((l) => l.lit);
  const sortedShades = [...world.shades].sort((a, b) =>
    a.id.localeCompare(b.id, undefined, { numeric: true })
  );
  updateShadeSafeZones(sortedShades, litLanterns, tuning.safe_radius, nextSimTick);

  // =========================================================================
  // BƯỚC 7: Tỏa Sáng (Pulse) — tác dụng lên Bóng Mực và Gió Lạc
  // =========================================================================
  if (pulseEdge) {
    const pulseRes = executePulse(
      player,
      world.shades,
      tuning.pulse_radius,
      tuning.pulse_cost,
      tuning.pulse_stun_s,
      tuning.pulse_push_m,
      tuning.pulse_cooldown_s,
      nextSimTick
    );

    if (pulseRes.triggered) {
      world.score += tuning.score.per_stun * pulseRes.stunnedIds.length;
      world.events.push({
        type: 'event',
        tick: nextTick,
        name: 'pulse',
        data: { stunned_ids: pulseRes.stunnedIds },
      });

      applyPulseToDrifters(world, tuning.pulse_radius, nextSimTick, nextTick);
    }
  }

  // =========================================================================
  // BƯỚC 8: Di chuyển Bóng Mực và Gió Lạc
  // =========================================================================
  for (const shade of sortedShades) {
    updateShadeMovement(
      shade,
      player.pos,
      player.fall_respawn_ticks > 0,
      world.map.shadeSpeed,
      litLanterns,
      tuning.safe_radius,
      world.map,
      nextSimTick
    );
  }
  updateDriftersMovement(world.drifters, player, nextSimTick);

  // =========================================================================
  // BƯỚC 9: Chạm — Gió Lạc cướp trước, rồi Bóng Mực gây hit (theo ID tăng dần)
  // =========================================================================
  checkDrifterSteals(world, nextSimTick, nextTick);

  const hittingShade = findHittingShade(
    player,
    sortedShades,
    tuning.shade_hit_radius,
    nextSimTick
  );
  if (hittingShade) {
    player.flames = Math.max(0, player.flames - 1);
    const dropped = Math.floor(player.carried * tuning.hit_drop_ratio);
    player.carried -= dropped;
    player.invuln_ticks = Math.round(tuning.invuln_s * 60); // 90 tick
    player.invuln_timer = player.invuln_ticks / 60;

    applyShadeRecoil(hittingShade, player.pos);

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
      const dropRes = generateDroppedMotes(
        player.pos,
        dropped,
        world.moteCounter,
        world.rng,
        nextSimTick + 1
      );
      world.motes.push(...dropRes.motes);
      world.moteCounter = dropRes.nextCounter;
    }
  }

  // =========================================================================
  // BƯỚC 10: Sinh đom đóm, Bóng Mực, Gió Lạc theo lịch (tương tác từ tick sau)
  // =========================================================================
  if (world.random_motes && nextSimTick % 240 === 0) {
    const spawnRes = spawnRandomMoteOnEmptyPoint(
      world.motes,
      world.map,
      world.moteCounter,
      world.rng,
      nextSimTick + 1
    );
    if (spawnRes.spawned) {
      world.motes.push(spawnRes.spawned);
      world.moteCounter = spawnRes.nextCounter;
    }
  }

  if (world.random_shades) {
    let toSpawn = 0;
    if (nextSimTick === 300) {
      toSpawn = 2;
    } else if (nextSimTick > 300 && (nextSimTick - 300) % world.map.shadeSpawnInterval === 0) {
      toSpawn = 1;
    }

    for (let i = 0; i < toSpawn; i++) {
      if (world.shades.length >= world.map.shadeMaxCount) break;
      const pos = world.findValidShadeSpawnPos();
      if (!pos) break;
      const newShade: Shade = {
        id: `S${world.shadeCounter++}`,
        pos,
        state: 'spawning',
        state_ticks_left: 1,
        stun_timer: 0,
        push_ticks_left: 0,
        push_step: [0, 0],
        recoil_step: [0, 0],
        safe_push_ticks_left: 0,
        safe_push_step: [0, 0],
        interactable_from_tick: nextSimTick + 1,
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

  trySpawnDrifter(world, nextSimTick);

  // =========================================================================
  // BƯỚC 11: Xét thắng/thua (no_flames > won/all_lit > dawn)
  // =========================================================================
  const noFlames = player.flames <= 0;
  const allLit = world.lanterns.every((l) => l.lit);
  const dawn = world.time_left_s <= 0;

  if (noFlames) {
    world.state = 'lost';
    world.events.push({
      type: 'event',
      tick: nextTick,
      name: 'game_over',
      data: { result: 'lost', reason: 'no_flames' },
    });
  } else if (allLit) {
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
  world.sim_tick = nextSimTick;
}
