import fs from 'node:fs';
import { ScenarioData } from '../core/world.js';
import { DrifterState, ShadeState, Vec3 } from '../core/entities.js';

const VALID_SHADE_STATES: ShadeState[] = ['spawning', 'wander', 'chase', 'recoil', 'stunned', 'drain'];
const VALID_DRIFTER_STATES: DrifterState[] = ['idle', 'chase', 'flee', 'removed'];

function validateVec3(v: unknown, name: string): Vec3 {
  if (!Array.isArray(v) || v.length !== 3 || v.some((x) => typeof x !== 'number')) {
    throw new Error(`${name} must be a 3-element number array [x, y, z]`);
  }
  return [v[0], v[1], v[2]];
}

function validateNonNegInt(v: unknown, name: string): number {
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 0) {
    throw new Error(`${name} must be a non-negative integer`);
  }
  return v;
}

export function parseScenarioFile(filePath: string): ScenarioData {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Scenario file not found: ${filePath}`);
  }

  let data: Record<string, unknown>;
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    data = JSON.parse(content);
  } catch {
    throw new Error(`Invalid JSON in scenario file: ${filePath}`);
  }

  if (typeof data !== 'object' || data === null) {
    throw new Error('Scenario root must be an object');
  }

  const result: ScenarioData = {};

  if (data.player !== undefined) {
    if (typeof data.player !== 'object' || data.player === null) {
      throw new Error('player must be an object');
    }
    const p = data.player as Record<string, unknown>;
    result.player = {};
    if (p.successful_lights !== undefined) result.player.successful_lights = validateNonNegInt(p.successful_lights, 'player.successful_lights');
    if (p.pos !== undefined) {
      result.player.pos = validateVec3(p.pos, 'player.pos');
    }
    if (p.carried !== undefined) {
      if (typeof p.carried !== 'number' || p.carried < 0) {
        throw new Error('player.carried must be a non-negative number');
      }
      result.player.carried = p.carried;
    }
    if (p.flames !== undefined) {
      if (typeof p.flames !== 'number' || p.flames < 0) {
        throw new Error('player.flames must be a non-negative number');
      }
      result.player.flames = p.flames;
    }
    if (p.invuln_ticks !== undefined) {
      result.player.invuln_ticks = validateNonNegInt(p.invuln_ticks, 'player.invuln_ticks');
    }
    if (p.dash_cd_ticks !== undefined) {
      result.player.dash_cd_ticks = validateNonNegInt(p.dash_cd_ticks, 'player.dash_cd_ticks');
    }
    if (p.pulse_cd_ticks !== undefined) {
      result.player.pulse_cd_ticks = validateNonNegInt(p.pulse_cd_ticks, 'player.pulse_cd_ticks');
    }
    if (p.charm_ticks !== undefined) {
      result.player.charm_ticks = validateNonNegInt(p.charm_ticks, 'player.charm_ticks');
    }
  }

  if (data.random_motes !== undefined) {
    if (typeof data.random_motes !== 'boolean') {
      throw new Error('random_motes must be a boolean');
    }
    result.random_motes = data.random_motes;
  }

  if (data.random_shades !== undefined) {
    if (typeof data.random_shades !== 'boolean') {
      throw new Error('random_shades must be a boolean');
    }
    result.random_shades = data.random_shades;
  }

  if (data.random_drifters !== undefined) {
    if (typeof data.random_drifters !== 'boolean') {
      throw new Error('random_drifters must be a boolean');
    }
    result.random_drifters = data.random_drifters;
  }

  if (data.wind_enabled !== undefined) {
    if (typeof data.wind_enabled !== 'boolean') {
      throw new Error('wind_enabled must be a boolean');
    }
    result.wind_enabled = data.wind_enabled;
  }

  if (data.motes !== undefined) {
    if (!Array.isArray(data.motes)) {
      throw new Error('motes must be an array');
    }
    result.motes = data.motes.map((m, idx) => validateVec3(m, `motes[${idx}]`));
  }

  if (data.shades !== undefined) {
    if (!Array.isArray(data.shades)) {
      throw new Error('shades must be an array');
    }
    result.shades = data.shades.map((s, idx) => {
      if (typeof s !== 'object' || s === null) {
        throw new Error(`shades[${idx}] must be an object`);
      }
      const item = s as Record<string, unknown>;
      const pos = validateVec3(item.pos, `shades[${idx}].pos`);
      const id = typeof item.id === 'string' ? item.id : undefined;
      let state: ShadeState | undefined;
      if (item.state !== undefined) {
        if (typeof item.state !== 'string' || !VALID_SHADE_STATES.includes(item.state as ShadeState)) {
          throw new Error(`Invalid shades[${idx}].state: ${String(item.state)}`);
        }
        state = item.state as ShadeState;
      }
      const state_ticks_left =
        item.state_ticks_left !== undefined
          ? validateNonNegInt(item.state_ticks_left, `shades[${idx}].state_ticks_left`)
          : undefined;
      if (item.target_lantern_id !== undefined && typeof item.target_lantern_id !== 'string') throw new Error('Invalid target_lantern_id');
      return { pos, id, state, state_ticks_left, target_lantern_id: item.target_lantern_id as string | undefined };
    });
  }

  if (data.drifters !== undefined) {
    if (!Array.isArray(data.drifters)) {
      throw new Error('drifters must be an array');
    }
    result.drifters = data.drifters.map((d, idx) => {
      if (typeof d !== 'object' || d === null) {
        throw new Error(`drifters[${idx}] must be an object`);
      }
      const item = d as Record<string, unknown>;
      const pos = validateVec3(item.pos, `drifters[${idx}].pos`);
      const id = typeof item.id === 'string' ? item.id : undefined;
      let state: DrifterState | undefined;
      if (item.state !== undefined) {
        if (
          typeof item.state !== 'string' ||
          !VALID_DRIFTER_STATES.includes(item.state as DrifterState)
        ) {
          throw new Error(`Invalid drifters[${idx}].state: ${String(item.state)}`);
        }
        state = item.state as DrifterState;
      }
      const stolen =
        item.stolen !== undefined ? validateNonNegInt(item.stolen, `drifters[${idx}].stolen`) : undefined;
      return { pos, id, state, stolen };
    });
  }

  if (data.charms !== undefined) {
    if (!Array.isArray(data.charms)) {
      throw new Error('charms must be an array');
    }
    result.charms = data.charms.map((c, idx) => {
      if (typeof c !== 'object' || c === null) {
        throw new Error(`charms[${idx}] must be an object`);
      }
      const item = c as Record<string, unknown>;
      if (typeof item.id !== 'string') {
        throw new Error(`charms[${idx}].id must be a string`);
      }
      const pos = item.pos !== undefined ? validateVec3(item.pos, `charms[${idx}].pos`) : undefined;
      const available = typeof item.available === 'boolean' ? item.available : undefined;
      const respawn_ticks =
        item.respawn_ticks !== undefined
          ? validateNonNegInt(item.respawn_ticks, `charms[${idx}].respawn_ticks`)
          : undefined;
      return { id: item.id, pos, available, respawn_ticks };
    });
  }

  if (data.lanterns !== undefined) {
    if (!Array.isArray(data.lanterns)) {
      throw new Error('lanterns must be an array');
    }
    result.lanterns = data.lanterns.map((l, idx) => {
      if (typeof l !== 'object' || l === null) {
        throw new Error(`lanterns[${idx}] must be an object`);
      }
      const item = l as Record<string, unknown>;
      if (typeof item.id !== 'string') {
        throw new Error(`lanterns[${idx}].id must be a string`);
      }
      const id = item.id;
      const pos = item.pos !== undefined ? validateVec3(item.pos, `lanterns[${idx}].pos`) : undefined;
      const lit = typeof item.lit === 'boolean' ? item.lit : undefined;
      const deposited = typeof item.deposited === 'number' ? item.deposited : undefined;
      if (item.fuel !== undefined && (typeof item.fuel !== 'number' || !Number.isFinite(item.fuel) || item.fuel < 0 || item.fuel > 100)) throw new Error('Invalid lantern fuel');
      if (item.ever_lit !== undefined && typeof item.ever_lit !== 'boolean') throw new Error('Invalid ever_lit');
      return { id, pos, lit, deposited, fuel: item.fuel as number | undefined, ever_lit: item.ever_lit as boolean | undefined };
    });
  }

  if (data.time_left_s !== undefined) {
    if (typeof data.time_left_s !== 'number' || data.time_left_s <= 0) {
      throw new Error('time_left_s must be a positive number');
    }
    result.time_left_s = data.time_left_s;
  }

  return result;
}
