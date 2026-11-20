import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { TUNING } from '../../../src/core/tuning.js';

describe('FR2-050: game.contract.json v1.1 tuning matches Ticket-02 & runtime', () => {
  it('FR2-050: contract_version is 1.1 and all Ticket-02 tuning values match exactly', () => {
    const contractPath = path.resolve(process.cwd(), 'game.contract.json');
    const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));

    expect(contract.contract_version).toBe('1.1');
    expect(contract.tuning).toEqual(TUNING);

    // Đối chiếu từng hằng số bắt buộc của Ticket-02 Phần 1 & 4
    expect(TUNING.player_speed).toBe(6.0);
    expect(TUNING.carry_capacity).toBe(10);
    expect(TUNING.lantern_cost).toBe(10);
    expect(TUNING.lantern_count_night1).toBe(5);
    expect(TUNING.pickup_radius).toBe(1.0);
    expect(TUNING.interact_radius).toBe(2.0);
    expect(TUNING.pulse_cost).toBe(3);
    expect(TUNING.pulse_radius).toBe(5.0);
    expect(TUNING.night1_duration_s).toBe(300);
    expect(TUNING.night2_duration_s).toBe(330);
    expect(TUNING.night3_duration_s).toBe(360);
    expect(TUNING.flames).toBe(3);
    expect(TUNING.invuln_s).toBe(1.5);
    expect(TUNING.hit_drop_ratio).toBe(0.5);
    expect(TUNING.pulse_stun_s).toBe(2.0);
    expect(TUNING.pulse_push_m).toBe(4.0);
    expect(TUNING.pulse_cooldown_s).toBe(3.0);
    expect(TUNING.safe_radius).toBe(6.0);
    expect(TUNING.shade_speed).toBe(4.0);
    expect(TUNING.shade_hit_radius).toBe(1.0);
    expect(TUNING.fall_enabled).toBe(true);
    expect(TUNING.dash_speed).toBe(14.0);
    expect(TUNING.dash_duration_s).toBe(0.2);
    expect(TUNING.dash_cooldown_s).toBe(1.5);
    expect(TUNING.score).toEqual({
      per_mote: 10,
      per_lantern: 100,
      per_stun: 5,
      per_second_left: 2,
      per_flame_left: 50,
    });
  });
});
