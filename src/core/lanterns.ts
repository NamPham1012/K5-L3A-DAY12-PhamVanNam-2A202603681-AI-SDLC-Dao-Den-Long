import { Lantern, Vec3 } from './entities.js';
import { round3 } from './world.js';

export function createDefaultLanterns(): Lantern[] {
  const lanterns: Lantern[] = [];
  for (let i = 0; i < 5; i++) {
    const angleRad = (i * 72 * Math.PI) / 180;
    const x = 25 * Math.sin(angleRad);
    const z = 25 * Math.cos(angleRad);
    lanterns.push({
      id: `L${i + 1}`,
      pos: [round3(x), 0, round3(z)],
      deposited: 0,
      lit: false,
    });
  }
  return lanterns;
}

export function findBestLanternToDeposit(
  playerPos: Vec3,
  lanterns: Lantern[],
  interactRadius: number
): Lantern | null {
  const interactRadiusSq = interactRadius * interactRadius;
  const candidates = lanterns
    .filter((l) => !l.lit)
    .map((l) => {
      const dx = playerPos[0] - l.pos[0];
      const dz = playerPos[2] - l.pos[2];
      const distSq = dx * dx + dz * dz;
      return { lantern: l, distSq };
    })
    .filter((c) => c.distSq <= interactRadiusSq);

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    if (Math.abs(a.distSq - b.distSq) > 0.0001) {
      return a.distSq - b.distSq;
    }
    return a.lantern.id.localeCompare(b.lantern.id);
  });

  return candidates[0].lantern;
}
