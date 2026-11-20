import { World } from './world.js';
import { InputState } from './entities.js';

const DT = 1 / 60;
const GRAVITY = -20.0;
const JUMP_VY = 7.0;
const CHARM_SPEED = 7.2;

export interface PlayerMoveEdges {
  jumpEdge: boolean;
  dashEdge: boolean;
}

export function stepPlayerPhysics(
  world: World,
  input: InputState,
  edges: PlayerMoveEdges,
  eventTick: number
): void {
  const player = world.player;
  const tuning = world.tuning;

  // Đang chờ hồi sinh sau rơi khỏi đảo: không di chuyển, không nhảy/lướt
  if (player.fall_respawn_ticks > 0) {
    player.vel = [0, 0, 0];
    player.velY = 0;
    return;
  }

  // Tính hướng di chuyển thế giới từ input.move & cam_yaw_deg
  const theta = (input.cam_yaw_deg * Math.PI) / 180;
  const mx = input.move[0];
  const mz = input.move[1];
  const worldDirX = mx * Math.cos(theta) + mz * Math.sin(theta);
  const worldDirZ = -mx * Math.sin(theta) + mz * Math.cos(theta);
  const moveLenSq = worldDirX * worldDirX + worldDirZ * worldDirZ;

  // Cập nhật hướng mặt nếu có di chuyển
  if (moveLenSq > 1e-8) {
    const moveLen = Math.sqrt(moveLenSq);
    player.facing = [worldDirX / moveLen, worldDirZ / moveLen];
  }

  // Kiểm tra kích hoạt Lướt (Dash): cạnh lên, không đang lướt, hết hồi chiêu (hoặc có Bùa Gió)
  if (edges.dashEdge && player.dash_ticks_left === 0) {
    const hasCharm = player.charm_ticks > 0;
    if (hasCharm || player.dash_cd_ticks === 0) {
      const dashTicks = Math.round(tuning.dash_duration_s * 60); // 12 tick
      const dashCdTicks = hasCharm ? 0 : Math.round(tuning.dash_cooldown_s * 60); // 90 tick
      player.dash_ticks_left = dashTicks;
      player.dash_cd_ticks = dashCdTicks;
      player.launch_vel = null; // vẫn được lướt khi đang bay từ bục

      if (moveLenSq > 1e-8) {
        const moveLen = Math.sqrt(moveLenSq);
        player.dash_dir = [worldDirX / moveLen, worldDirZ / moveLen];
      } else {
        player.dash_dir = [player.facing[0], player.facing[1]];
      }

      world.events.push({
        type: 'event',
        tick: eventTick,
        name: 'dash',
        data: {},
      });
    }
  }

  // Tính vận tốc ngang (vx, vz)
  let vx = 0;
  let vz = 0;

  if (player.dash_ticks_left > 0) {
    vx = player.dash_dir[0] * tuning.dash_speed;
    vz = player.dash_dir[1] * tuning.dash_speed;
  } else if (player.launch_vel !== null) {
    // Đang bay từ bục nhảy: vận tốc phóng giữ nguyên tới khi chạm đất
    vx = player.launch_vel[0];
    vz = player.launch_vel[1];
  } else {
    const runSpeed = player.charm_ticks > 0 ? CHARM_SPEED : tuning.player_speed;
    vx = worldDirX * runSpeed;
    vz = worldDirZ * runSpeed;
  }

  // Cộng thêm vận tốc gió (Đêm 3, nếu đang có gió)
  if (world.wind.active) {
    const windRad = (world.wind.dir_deg * Math.PI) / 180;
    vx += 2.0 * Math.cos(windRad);
    vz += 2.0 * Math.sin(windRad);
  }

  // Vận tốc dọc (vy) & nhảy — tích phân chính xác: y += vy*dt + 0.5*g*dt^2, rồi vy += g*dt
  const currentY = player.pos[1];
  let vy = player.vel[1];
  let nextY = currentY;
  if (player.dash_ticks_left > 0) {
    // Lướt trên không giữ nguyên độ cao (không trọng lực)
    vy = 0;
  } else {
    if (edges.jumpEdge && player.grounded) {
      vy = JUMP_VY;
      player.grounded = false;
    }
    nextY = currentY + vy * DT + 0.5 * GRAVITY * DT * DT;
    vy += GRAVITY * DT;
  }

  // Di chuyển ngang XZ (kiểm tra chặn vách/tháp theo map)
  const fromX = player.pos[0];
  const fromZ = player.pos[2];
  let nextX = fromX + vx * DT;
  let nextZ = fromZ + vz * DT;

  if (world.map.isBlockedXZ(fromX, fromZ, nextX, nextZ, currentY)) {
    nextX = fromX;
    nextZ = fromZ;
    vx = 0;
    vz = 0;
  }

  // Kiểm tra mặt đất tại (nextX, nextZ)
  const groundY = world.map.groundHeight(nextX, nextZ, currentY);
  if (groundY !== null && nextY <= groundY + 1e-6 && vy <= 0) {
    nextY = groundY;
    vy = 0;
    player.grounded = true;
    player.launch_vel = null;
  } else {
    player.grounded = false;
  }

  player.pos = [nextX, nextY, nextZ];
  player.vel = [vx, vy, vz];
  player.velY = vy;

  // Giảm dash_ticks_left sau khi hoàn thành 1 tick lướt
  if (player.dash_ticks_left > 0) {
    player.dash_ticks_left -= 1;
  }

  // Kiểm tra bục nhảy (nếu grounded trên bục)
  if (player.grounded && world.map.jumpPads.length > 0) {
    for (const pad of world.map.jumpPads) {
      const dx = player.pos[0] - pad.pos[0];
      const dz = player.pos[2] - pad.pos[2];
      const dy = Math.abs(player.pos[1] - pad.pos[1]);
      if (dx * dx + dz * dz <= pad.radius * pad.radius && dy <= 0.5) {
        player.vel[1] = pad.launchVy;
        player.velY = pad.launchVy;
        player.launch_vel = [
          pad.targetDir[0] * pad.launchHorizSpeed,
          pad.targetDir[1] * pad.launchHorizSpeed,
        ];
        player.vel[0] = player.launch_vel[0];
        player.vel[2] = player.launch_vel[1];
        player.grounded = false;
        break;
      }
    }
  }

  // Kiểm tra rơi khỏi đảo (Y < -10): xảy ra đúng 1 lần, bỏ qua bất tử
  if (tuning.fall_enabled && player.pos[1] < -10) {
    const lost = player.carried;
    player.flames = Math.max(0, player.flames - 1);
    player.carried = 0;
    player.vel = [0, 0, 0];
    player.velY = 0;
    player.dash_ticks_left = 0;
    player.launch_vel = null;
    player.grounded = false;

    world.events.push({
      type: 'event',
      tick: eventTick,
      name: 'player_hit',
      data: {
        by: 'fall',
        flames: player.flames,
        dropped: 0,
        lost,
      },
    });

    if (player.flames > 0) {
      player.fall_respawn_ticks = 60;
    }
  }
}
