import { Vec3 } from '../entities.js';
import { NightMap } from './night1.js';

function pointOnCircle(cx: number, cz: number, r: number, deg: number, y: number = 0): Vec3 {
  const rad = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(rad), y, cz + r * Math.sin(rad)];
}

function buildNight2MoteSpawns(): Vec3[] {
  const pts: Vec3[] = [];
  // Đảo A tâm (0,0) và Đảo B tâm (70,0): mỗi đảo 4 điểm r10 (0,90,180,270) + 8 điểm r22 (mỗi 45°)
  for (const cx of [0, 70]) {
    for (let i = 0; i < 4; i++) {
      pts.push(pointOnCircle(cx, 0, 10, i * 90, 0));
    }
    for (let i = 0; i < 8; i++) {
      pts.push(pointOnCircle(cx, 0, 22, i * 45, 0));
    }
  }
  return pts;
}

function buildNight2ShadeSpawns(): Vec3[] {
  const pts: Vec3[] = [];
  // Mỗi đảo 8 điểm bán kính 26 m (22.5°, 67.5°, ...)
  for (const cx of [0, 70]) {
    for (let i = 0; i < 8; i++) {
      pts.push(pointOnCircle(cx, 0, 26, 22.5 + i * 45, 0));
    }
  }
  return pts;
}

// Bục nhảy (20,0,18) -> hướng tâm đảo B (70,0,0) và (50,0,-18) -> hướng tâm đảo A (0,0,0)
const PAD_DX = 50;
const PAD_DZ = -18;
const PAD_LEN = Math.sqrt(PAD_DX * PAD_DX + PAD_DZ * PAD_DZ);

export const NIGHT2_MAP: NightMap = {
  night: 2,
  startPos: [0, 0, 0],
  startFacing: [0, 1],
  duration_s: 330,
  shadeSpeed: 4.0,
  shadeSpawnInterval: 420,
  shadeMaxCount: 8,
  lanterns: [
    { id: 'L1', pos: [0, 0, 20] },
    { id: 'L2', pos: [17, 0, -10] },
    { id: 'L3', pos: [-17, 0, -10] },
    { id: 'L4', pos: [70, 0, 20] },
    { id: 'L5', pos: [87, 0, -10] },
    { id: 'L6', pos: [53, 0, -10] },
  ],
  moteSpawnPoints: buildNight2MoteSpawns(),
  shadeSpawnPoints: buildNight2ShadeSpawns(),
  charms: [{ id: 'C1', pos: [35, 0, 0] }],
  jumpPads: [
    {
      pos: [20, 0, 18],
      radius: 1.0,
      launchVy: 14.0,
      launchHorizSpeed: 24.0,
      targetDir: [PAD_DX / PAD_LEN, PAD_DZ / PAD_LEN],
    },
    {
      pos: [50, 0, -18],
      radius: 1.0,
      launchVy: 14.0,
      launchHorizSpeed: 24.0,
      targetDir: [-PAD_DX / PAD_LEN, -PAD_DZ / PAD_LEN],
    },
  ],
  groundHeight(x: number, z: number, _currentY: number): number | null {
    // Đảo A: tâm (0,0), r=28
    if (x * x + z * z <= 28 * 28) return 0;
    // Đảo B: tâm (70,0), r=28
    const bx = x - 70;
    if (bx * bx + z * z <= 28 * 28) return 0;
    // Cầu tre: x ∈ [26, 44], z ∈ [-2, 2]
    if (x >= 26 && x <= 44 && z >= -2 && z <= 2) return 0;
    return null;
  },
  isBlockedXZ(): boolean {
    return false;
  },
};
