import { World } from './world.js';

/**
 * Xử lý cạnh lên nút pause ở Bước 1 của tick.
 * Trả về true nếu simulation đang tạm dừng (cần kết thúc tick ngay, không tăng sim_tick).
 */
export function handlePauseEdge(world: World, pauseEdge: boolean, nextTick: number): boolean {
  if (pauseEdge) {
    if (world.state === 'playing') {
      world.state = 'paused';
      world.events.push({
        type: 'event',
        tick: nextTick,
        name: 'paused',
        data: {},
      });
      world.tick = nextTick;
      return true;
    } else if (world.state === 'paused') {
      world.state = 'playing';
      world.events.push({
        type: 'event',
        tick: nextTick,
        name: 'resumed',
        data: {},
      });
    }
  }

  if (world.state === 'paused') {
    world.tick = nextTick;
    return true;
  }

  return false;
}
