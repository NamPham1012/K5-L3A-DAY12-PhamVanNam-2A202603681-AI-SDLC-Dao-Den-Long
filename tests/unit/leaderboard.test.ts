import { expect, it } from 'vitest';
import { topEntries, validateEntry } from '../../src/core/leaderboard.js';
it('FR4-021 validate và xếp top 10 theo điểm và thời gian', () => {
  const base = {name:'May_1', score:10, nights_won:1, seed:7, achieved_at:'2026-11-20T18:00:00+07:00'};
  expect(validateEntry(base)).toBe(true);
  expect(validateEntry({...base,name:'a!'})).toBe(false);
  expect(validateEntry({...base,achieved_at:'2026-11-20T18:00:00'})).toBe(false);
  expect(topEntries([{...base,name:'Later',achieved_at:'2026-11-20T19:00:00+07:00'},base])[0]).toEqual(base);
  expect(topEntries(Array.from({length:12}, (_, i) => ({...base,score:i}))).map(e=>e.score)).toEqual([11,10,9,8,7,6,5,4,3,2]);
});
