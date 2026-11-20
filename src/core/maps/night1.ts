import { Vec2, Vec3 } from '../entities.js';

export interface JumpPad {
  pos: Vec3;
  radius: number;
  launchVy: number;
  launchHorizSpeed: number;
  targetDir: Vec2; // normalized XZ direction
}

export interface NightMap {
  night: 1 | 2 | 3;
  startPos: Vec3;
  startFacing: Vec2;
  duration_s: number;
  shadeSpeed: number;
  shadeSpawnInterval: number;
  shadeMaxCount: number;
  lanterns: { id: string; pos: Vec3 }[];
  moteSpawnPoints: Vec3[];
  shadeSpawnPoints: Vec3[];
  charms: { id: string; pos: Vec3 }[];
  jumpPads: JumpPad[];
  groundHeight: (x: number, z: number, currentY: number) => number | null;
  isBlockedXZ: (
    fromX: number,
    fromZ: number,
    toX: number,
    toZ: number,
    currentY: number
  ) => boolean;
}

function pointOnCircle(r: number, deg: number, y: number = 0): Vec3 {
  const rad = (deg * Math.PI) / 180;
  return [r * Math.cos(rad), y, r * Math.sin(rad)];
}

function buildNight1MoteSpawns(): Vec3[] {
  const pts: Vec3[] = [];
  // 8 điểm trên bán kính 12 m (mỗi 45°: 0°, 45°, ..., 315°)
  for (let i = 0; i < 8; i++) {
    pts.push(pointOnCircle(12, i * 45, 0));
  }
  // 16 điểm trên bán kính 33 m (mỗi 22.5°: 0°, 22.5°, ..., 337.5°)
  for (let i = 0; i < 16; i++) {
    pts.push(pointOnCircle(33, i * 22.5, 0));
  }
  return pts;
}

function buildNight1ShadeSpawns(): Vec3[] {
  const pts: Vec3[] = [];
  // 12 điểm trên bán kính 37 m (15°, 45°, ..., 345°)
  for (let i = 0; i < 12; i++) {
    pts.push(pointOnCircle(37, 15 + i * 30, 0));
  }
  return pts;
}

export const NIGHT1_MAP: NightMap = {
  night: 1,
  startPos: [0, 0, 0],
  startFacing: [0, 1],
  duration_s: 300,
  shadeSpeed: 4.0,
  shadeSpawnInterval: 480,
  shadeMaxCount: 6,
  lanterns: [
    { id: 'L1', pos: [0, 0, 25] },
    { id: 'L2', pos: [23.8, 0, 7.7] },
    { id: 'L3', pos: [14.7, 0, -20.2] },
    { id: 'L4', pos: [-14.7, 0, -20.2] },
    { id: 'L5', pos: [-23.8, 0, 7.7] },
  ],
  moteSpawnPoints: buildNight1MoteSpawns(),
  shadeSpawnPoints: buildNight1ShadeSpawns(),
  charms: [],
  jumpPads: [],
  groundHeight(x: number, z: number, _currentY: number): number | null {
    // Đảo tròn tâm (0,0,0), bán kính 40 m. Ngoài 40 m là biển mây (rơi).
    if (x * x + z * z <= 40 * 40) {
      return 0;
    }
    return null;
  },
  isBlockedXZ(): boolean {
    return false;
  },
};

export function getMapForNight(night: 1 | 2 | 3): NightMap {
  // Nhóm A triển khai Đêm 1; Đêm 2 & 3 sẽ được tách vào night2.ts & night3.ts ở Nhóm B.
  if (night === 1) return NIGHT1_MAP;
  return {
    ...NIGHT1_MAP,
    night,
    duration_s: night === 2 ? 330 : 360,
    shadeSpeed: night === 3 ? 4.5 : 4.0,
    shadeSpawnInterval: night === 2 ? 420 : 360,
    shadeMaxCount: night === 2 ? 8 : 10,
  };
}
