import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runCliSync } from '../cli-helper.js';

const dirs: string[] = [];
afterEach(() => { for (const d of dirs.splice(0)) fs.rmSync(d, {recursive:true, force:true}); });
function run(scenario: any, frames: any[] = [], ticks = 1, snapshotEvery = 1) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fr3-')); dirs.push(dir);
  const s = path.join(dir, 'scenario.json'), i = path.join(dir, 'inputs.json'), out = path.join(dir, 'out.jsonl');
  fs.writeFileSync(s, JSON.stringify({random_motes:false, random_shades:false, random_drifters:false, motes:[], shades:[], ...scenario}));
  fs.writeFileSync(i, JSON.stringify({frames}));
  const r = runCliSync({scenarioPath:s, inputsPath:i, out, ticks, snapshotEvery});
  expect(r.status, r.stderr).toBe(0); return r.readLines<any>();
}
const snap = (lines: any[], tick: number) => lines.find(l => l.type === 'snapshot' && l.tick === tick);
const event = (lines: any[], name: string) => lines.find(l => l.type === 'event' && l.name === name);
const lan = (id: string, fuel: number) => ({id, lit:true, fuel});

describe('FR3 acceptance: CLI thực', () => {
  it('FR3-001: hao 600 tick và tắt ở 6000', () => {
    const l = run({time_left_s:200, lanterns:[lan('L1',100)]}, [], 6000, 600);
    expect(snap(l,600).lanterns[0].fuel).toBe(90);
    expect(event(l,'lantern_out').tick).toBe(6000);
    expect(snap(l,6000).lanterns[0]).toMatchObject({lit:false, fuel:0, deposited:0, ever_lit:true});
  });
  it('FR3-002: châm 5 đơn vị từ fuel 50', () => {
    const l = run({player:{pos:[0,0,0],carried:7}, lanterns:[{...lan('L1',50+1/60),pos:[0,0,1]}]}, [{tick:0,interact:true}]);
    expect(event(l,'refuel').data).toMatchObject({lantern_id:'L1',amount:5,fuel:100});
    expect(snap(l,1).player.carried).toBe(2); expect(snap(l,1).score).toBe(25);
  });
  it('FR3-003: dầu hao trước tương tác, chọn L1 gần hơn để châm', () => {
    const l = run({player:{pos:[0,0,0],carried:5},lanterns:[{...lan('L1',100),pos:[0,0,1]},{id:'L2',pos:[0,0,1.5]}]},[{tick:0,interact:true}]);
    expect(event(l,'refuel').data).toEqual({lantern_id:'L1',amount:1,fuel:100});
    expect(event(l,'deposit')).toBeUndefined();
    expect(snap(l,1).player.carried).toBe(4);
  });
  it('FR3-004: thắp lại tăng điểm và sức chứa', () => {
    const l = run({player:{pos:[0,0,0],carried:5},lanterns:[{id:'L1',pos:[0,0,1],ever_lit:true,lit:false}]},[{tick:0,interact:true}]);
    expect(event(l,'lantern_lit').data).toEqual({lantern_id:'L1',relight:true});
    expect(snap(l,1).score).toBe(65); expect(snap(l,1).player.capacity).toBe(12); expect(snap(l,1).lanterns[0].relit_count).toBe(1);
  });
  it('FR3-005: shade wander tới đèn yếu và hút 6 dầu mỗi giây', () => {
    const l = run({player:{pos:[-30,0,0]},lanterns:[lan('L1',29)],shades:[{id:'S1',pos:[0,0,22],state:'wander'}]},[],91,1);
    const entry = l.find(x => x.type === 'snapshot' && x.shades[0].state === 'drain');
    expect(entry).toBeDefined(); expect(event(l,'fuel_drain').tick).toBe(entry.tick + 60);
    expect(snap(l,entry.tick + 60).lanterns[0].fuel).toBeCloseTo(entry.lanterns[0].fuel - 6,1);
  });
  it('FR3-006: pulse trúng shade drain được 15 điểm', () => {
    const l = run({player:{pos:[0,0,0],carried:3},lanterns:[{...lan('L1',29),pos:[0,0,3]}],shades:[{id:'S1',pos:[0,0,2],state:'drain',target_lantern_id:'L1'}]},[{tick:0,pulse:true}]);
    expect(event(l,'pulse').data.stunned_ids).toEqual(['S1']); expect(snap(l,1).score).toBe(15); expect(snap(l,1).shades[0].state).toBe('stunned');
  });
  it('FR3-007: ngưỡng an toàn 30 và 29.9', () => {
    const a = run({player:{pos:[-30,0,0]},lanterns:[lan('L1',30+1/60)],shades:[{id:'S1',pos:[0,0,21],state:'wander'}]},[],1);
    expect(snap(a,1).shades[0].pos[2]).toBeLessThan(21);
    const b = run({player:{pos:[-30,0,0]},lanterns:[lan('L1',29.9)],shades:[{id:'S1',pos:[0,0,21],state:'wander'}]},[],1);
    expect(snap(b,1).shades[0].pos[2]).toBeGreaterThanOrEqual(21);
  });
  it('FR3-008: bình minh 3 đèn và 3 lửa thắng với điểm yêu cầu', () => {
    const ticks = 60;
    const fuels = [100, 80, 50];
    const l = run({time_left_s:1,lanterns:fuels.map((fuel, index) => lan(`L${index + 1}`, fuel))}, [], ticks, ticks);
    const expected = 3 * 50 + fuels.reduce((sum, fuel) => sum + Math.floor(fuel - ticks / 60), 0) + 3 * 50;
    expect(event(l,'game_over').data).toEqual({result:'won',reason:'dawn_survived'});
    expect(expected).toBe(527);
    expect(snap(l,ticks).score).toBe(expected);
  });
  it('FR3-009: bình minh thiếu đèn thua và hết lửa ưu tiên', () => {
    const a = run({time_left_s:1/60,lanterns:[lan('L1',100),lan('L2',80)]}); expect(event(a,'game_over').data.reason).toBe('dawn');
    const b = run({time_left_s:1/60,player:{flames:0},lanterns:[lan('L1',100),lan('L2',80),lan('L3',50)]}); expect(event(b,'game_over').data.reason).toBe('no_flames');
  });
  it('FR3-010: đủ năm đèn không thắng sớm', () => {
    const l = run({lanterns:[1,2,3,4,5].map(n=>lan(`L${n}`,100))}); expect(event(l,'game_over')).toBeUndefined(); expect(snap(l,1).state).toBe('playing');
  });
});
