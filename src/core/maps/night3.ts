import { Vec3 } from '../entities.js';
import { NightMap } from './night1.js';

function pointOnCircle(r: number, deg: number, y: number): Vec3 {
  const rad = (deg * Math.PI) / 180;
  return [r * Math.cos(rad), y, r * Math.sin(rad)];
}

function buildNight3MoteSpawns(): Vec3[] {
  const pts: Vec3[] = [];
  // Tầng 0: 18 điểm bán kính 34 m (mỗi 20° từ 0°)
  for (let i = 0; i < 18; i++) {
    pts.push(pointOnCircle(34, i * 20, 0));
  }
  // Tầng 1 (Y=3): 8 điểm bán kính 18 m (20°, 40°, ..., 160°)
  for (let i = 1; i <= 8; i++) {
    pts.push(pointOnCircle(18, i * 20, 3));
  }
  // Tầng 2 (Y=6): 4 điểm bán kính 5 m (45°, 135°, 225°, 315°)
  for (const deg of [45, 135, 225, 315]) {
    pts.push(pointOnCircle(5, deg, 6));
  }
  return pts;
}

function buildNight3ShadeSpawns(): Vec3[] {
  const pts: Vec3[] = [];
  // 16 điểm bán kính 43 m (mỗi 22.5°)
  for (let i = 0; i < 16; i++) {
    pts.push(pointOnCircle(43, i * 22.5, 0));
  }
  return pts;
}

const RAMP_ANGLES_RAD = [(30 * Math.PI) / 180, (150 * Math.PI) / 180];

/**
 * Trả về độ cao trên dốc 30° hoặc 150° nếu (x, z) nằm trong dải rộng 3m (nửa rộng 1.5m),
 * dọc bán kính từ r=30 (y=0) đến r=24 (y=3). Trả về null nếu không nằm trên dốc.
 */
function getRampHeight(x: number, z: number): number | null {
  for (const rad of RAMP_ANGLES_RAD) {
    const ux = Math.cos(rad);
    const uz = Math.sin(rad);
    const nx = -uz;
    const nz = ux;
    const s = x * ux + z * uz;
    const w = Math.abs(x * nx + z * nz);
    if (s >= 24 && s <= 30 && w <= 1.5) {
      return 3.0 * ((30 - s) / 6.0);
    }
  }
  return null;
}

function isInTier1(x: number, z: number): boolean {
  const rSq = x * x + z * z;
  return z > 0 && rSq >= 12 * 12 && rSq <= 24 * 24;
}

function isInTier2(x: number, z: number): boolean {
  return x * x + z * z <= 8 * 8;
}

export const NIGHT3_MAP: NightMap = {
  night: 3,
  startPos: [0, 0, -30],
  startFacing: [0, 1],
  duration_s: 360,
  shadeSpeed: 4.5,
  shadeSpawnInterval: 360,
  shadeMaxCount: 10,
  lanterns: [
    { id: 'L1', pos: [0, 6, 6] },
    { id: 'L2', pos: [18, 3, 10] },
    { id: 'L3', pos: [-18, 3, 10] },
    { id: 'L4', pos: [35, 0, -10] },
    { id: 'L5', pos: [-35, 0, -10] },
    { id: 'L6', pos: [20, 0, -35] },
    { id: 'L7', pos: [-20, 0, -35] },
  ],
  moteSpawnPoints: buildNight3MoteSpawns(),
  shadeSpawnPoints: buildNight3ShadeSpawns(),
  charms: [
    { id: 'C1', pos: [30, 0, 25] },
    { id: 'C2', pos: [-30, 0, 25] },
  ],
  jumpPads: [
    {
      pos: [0, 3, 13],
      radius: 1.0,
      launchVy: 12.0,
      launchHorizSpeed: 8.0,
      targetDir: [0, -1], // hướng -Z đáp lên tầng 2
    },
  ],
  groundHeight(x: number, z: number, currentY: number): number | null {
    const rSq = x * x + z * z;
    if (rSq > 45 * 45) return null;

    // Thu thập các bề mặt tại (x, z) có độ cao <= currentY + 0.35 (không tự nâng xuyên vách)
    const surfaces: number[] = [0];
    const rampY = getRampHeight(x, z);
    if (rampY !== null) surfaces.push(rampY);
    if (isInTier1(x, z)) surfaces.push(3);
    if (isInTier2(x, z)) surfaces.push(6);

    let best = 0;
    for (const h of surfaces) {
      if (h <= currentY + 0.35 && h > best) {
        best = h;
      }
    }
    return best;
  },
  isBlockedXZ(
    fromX: number,
    fromZ: number,
    toX: number,
    toZ: number,
    currentY: number
  ): boolean {
    // 1. Tháp chuông tâm tầng 2: hình trụ bán kính 2 m, cao 8 m (từ Y=6..14, chặn xuyên tâm)
    if (toX * toX + toZ * toZ < 2 * 2 && currentY < 14) {
      return true;
    }

    // 2. Vách đứng tầng 2 (Y=6, r <= 8): chặn nếu mặt đích cao hơn chân > 0.01 m
    if (isInTier2(toX, toZ) && currentY < 6 - 0.01) {
      return true;
    }

    // 3. Vách đứng tầng 1 (Y=3, 12 <= r <= 24, z > 0):
    // Cho phép bước từ đỉnh dốc (currentY >= 2.75) lên tầng 1; chặn mọi lối đâm ngang từ dưới thấp
    if (isInTier1(toX, toZ) && !isInTier1(fromX, fromZ)) {
      const fromRamp = getRampHeight(fromX, fromZ);
      const allowedFromRamp = fromRamp !== null && currentY >= 2.7;
      if (!allowedFromRamp && currentY < 3 - 0.01) {
        return true;
      }
    }

    return false;
  },
};
