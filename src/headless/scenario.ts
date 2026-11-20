import fs from 'node:fs';
import { ScenarioData } from '../core/world.js';
import { Vec3 } from '../core/entities.js';

function validateVec3(v: unknown, name: string): Vec3 {
  if (!Array.isArray(v) || v.length !== 3 || v.some((x) => typeof x !== 'number')) {
    throw new Error(`${name} must be a 3-element number array [x, y, z]`);
  }
  return [v[0], v[1], v[2]];
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
      return { pos, id };
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
      return { id, pos, lit, deposited };
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
