import { NightMap, NIGHT1_MAP } from './night1.js';
import { NIGHT2_MAP } from './night2.js';
import { NIGHT3_MAP } from './night3.js';

export type { NightMap, JumpPad } from './night1.js';
export { NIGHT1_MAP, NIGHT2_MAP, NIGHT3_MAP };

export function getMapForNight(night: 1 | 2 | 3): NightMap {
  if (night === 1) return NIGHT1_MAP;
  if (night === 2) return NIGHT2_MAP;
  return NIGHT3_MAP;
}
