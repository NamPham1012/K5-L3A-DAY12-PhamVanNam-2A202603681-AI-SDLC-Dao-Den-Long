import { expect, it } from 'vitest';
import { World } from '../../src/core/world.js';
import { TUNING } from '../../src/core/tuning.js';
it('FR4-002: cờ bench mặc định tắt; khi bật thì đóng băng hao dầu và kết thúc', () => {
  const w = new World(42, {time_left_s:1/60, random_motes:false, random_shades:false, motes:[[0,0,0]], lanterns:[{id:'L1',lit:true}]}, TUNING);
  expect(w.bench).toBe(false);
  w.bench = true;
  const input = {move:[0,0] as [number,number],cam_yaw_deg:0,jump:false,interact:false,pulse:false};
  w.step(input);
  expect(w.lanterns[0].fuel_u).toBe(6000);
  expect(w.player.carried).toBe(0);
  expect(w.state).toBe('playing');
  expect(w.motes.filter(m=>m.active)).toHaveLength(1);
});
