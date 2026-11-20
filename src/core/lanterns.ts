import { Lantern, Vec3 } from './entities.js';

export function findBestLanternToDeposit(
  playerPos: Vec3,
  lanterns: Lantern[],
  interactRadius: number
): Lantern | null {
  const interactRadiusSq = interactRadius * interactRadius;
  const candidates = lanterns
    .filter((l) => !l.lit || l.fuel_u < 6000)
    .map((l) => {
      const dx = playerPos[0] - l.pos[0];
      const dz = playerPos[2] - l.pos[2];
      const distSq = dx * dx + dz * dz;
      return { lantern: l, distSq };
    })
    .filter((c) => c.distSq <= interactRadiusSq);

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    if (Math.abs(a.distSq - b.distSq) > 1e-6) {
      return a.distSq - b.distSq;
    }
    return a.lantern.id.localeCompare(b.lantern.id, undefined, { numeric: true });
  });

  return candidates[0].lantern;
}
