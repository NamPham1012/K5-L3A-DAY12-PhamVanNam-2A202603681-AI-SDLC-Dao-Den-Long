import { PRNG } from './rng.js';
import { TUNING, TuningConfig } from './tuning.js';
import {
  Player,
  Mote,
  Lantern,
  Shade,
  SimEvent,
  SnapshotOutput,
  InputState,
  Vec3,
} from './entities.js';
import { stepWorld } from './step.js';

export function round3(n: number): number {
  const rounded = Math.round(n * 1000) / 1000;
  return Object.is(rounded, -0) ? 0 : rounded;
}

export function roundVec3(v: Vec3): Vec3 {
  return [round3(v[0]), round3(v[1]), round3(v[2])];
}

export interface ScenarioData {
  player?: {
    pos?: Vec3;
    carried?: number;
    flames?: number;
  };
  random_motes?: boolean;
  random_shades?: boolean;
  motes?: Vec3[];
  shades?: { id?: string; pos: Vec3 }[];
  lanterns?: { id: string; pos?: Vec3; lit?: boolean; deposited?: number }[];
  time_left_s?: number;
}

export class World {
  public tick: number = 0;
  public sim_tick: number = 0;
  public initial_duration_s: number;
  public time_left_s: number;
  public score: number = 0;
  public state: 'playing' | 'won' | 'lost' = 'playing';

  public player: Player;
  public lanterns: Lantern[] = [];
  public motes: Mote[] = [];
  public shades: Shade[] = [];

  public rng: PRNG;
  public moteCounter: number = 1;
  public shadeCounter: number = 1;

  public random_motes: boolean = true;
  public random_shades: boolean = true;

  public events: SimEvent[] = [];
  public tuning: TuningConfig;

  constructor(seed: number, scenario?: ScenarioData, tuning: TuningConfig = TUNING) {
    this.tuning = tuning;
    this.rng = new PRNG(seed);
    this.initial_duration_s = scenario?.time_left_s ?? tuning.night1_duration_s;
    this.time_left_s = this.initial_duration_s;

    if (scenario?.random_motes !== undefined) {
      this.random_motes = scenario.random_motes;
    }
    if (scenario?.random_shades !== undefined) {
      this.random_shades = scenario.random_shades;
    }

    // 1. Player setup
    this.player = {
      pos: scenario?.player?.pos ? [...scenario.player.pos] : [0, 0, 0],
      velY: 0,
      flames: scenario?.player?.flames ?? tuning.flames,
      carried: scenario?.player?.carried ?? 0,
      invuln_timer: 0,
      pulse_cooldown_timer: 0,
      prevButtons: {
        jump: false,
        interact: false,
        pulse: false,
      },
    };

    // 2. Lanterns setup (L1..L5 on 25m circle)
    this.initLanterns(scenario?.lanterns);

    // 3. Motes setup
    this.initMotes(scenario?.motes);

    // 4. Shades setup
    this.initShades(scenario?.shades);
  }

  private initLanterns(scenarioLanterns?: ScenarioData['lanterns']): void {
    const defaultLanterns: Lantern[] = [];
    for (let i = 0; i < 5; i++) {
      const angleRad = (i * 72 * Math.PI) / 180;
      const x = 25 * Math.sin(angleRad);
      const z = 25 * Math.cos(angleRad);
      defaultLanterns.push({
        id: `L${i + 1}`,
        pos: [round3(x), 0, round3(z)],
        deposited: 0,
        lit: false,
      });
    }

    if (scenarioLanterns) {
      for (const override of scenarioLanterns) {
        const found = defaultLanterns.find((l) => l.id === override.id);
        if (found) {
          if (override.pos) found.pos = [...override.pos];
          if (override.deposited !== undefined) found.deposited = override.deposited;
          if (override.lit !== undefined) found.lit = override.lit;
        }
      }
    }

    this.lanterns = defaultLanterns;
  }

  private initMotes(scenarioMotes?: Vec3[]): void {
    if (scenarioMotes !== undefined) {
      // Scenario replaces motes list
      this.motes = scenarioMotes.map((pos) => ({
        id: `M${this.moteCounter++}`,
        pos: [pos[0], 0, pos[2]],
        active: true,
      }));
      return;
    }

    // Default: 50 motes within 38m, >= 3m from each lantern and player
    if (this.random_motes) {
      let count = 0;
      while (count < 50) {
        const angle = this.rng.nextFloat(0, Math.PI * 2);
        const radius = Math.sqrt(this.rng.next()) * 38;
        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);

        // check >= 3m from player (0,0,0)
        const distPlayerSq = x * x + z * z;
        if (distPlayerSq < 9) continue;

        // check >= 3m from each lantern
        let valid = true;
        for (const lantern of this.lanterns) {
          const dx = x - lantern.pos[0];
          const dz = z - lantern.pos[2];
          if (dx * dx + dz * dz < 9) {
            valid = false;
            break;
          }
        }

        if (valid) {
          this.motes.push({
            id: `M${this.moteCounter++}`,
            pos: [round3(x), 0, round3(z)],
            active: true,
          });
          count++;
        }
      }
    }
  }

  private initShades(scenarioShades?: ScenarioData['shades']): void {
    if (scenarioShades !== undefined) {
      this.shades = scenarioShades.map((s) => {
        let shadeId = s.id;
        if (!shadeId) {
          shadeId = `S${this.shadeCounter++}`;
        } else {
          const match = shadeId.match(/^S(\d+)$/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num >= this.shadeCounter) {
              this.shadeCounter = num + 1;
            }
          }
        }
        return {
          id: shadeId,
          pos: [s.pos[0], 1.0, s.pos[2]],
          state: 'chase',
          stun_timer: 0,
        };
      });
      return;
    }

    // Default: 2 shades initially spawned, no shade_spawned event
    if (this.random_shades) {
      for (let i = 0; i < 2; i++) {
        const pos = this.findShadeSpawnPos();
        this.shades.push({
          id: `S${this.shadeCounter++}`,
          pos,
          state: 'chase',
          stun_timer: 0,
        });
      }
    }
  }

  public findShadeSpawnPos(): Vec3 {
    let bestPos: Vec3 = [38, 1.0, 0];
    let maxDistSq = -1;

    for (let attempt = 0; attempt < 8; attempt++) {
      const angle = this.rng.nextFloat(0, Math.PI * 2);
      const x = 38 * Math.cos(angle);
      const z = 38 * Math.sin(angle);
      const dx = x - this.player.pos[0];
      const dz = z - this.player.pos[2];
      const distSq = dx * dx + dz * dz;

      if (distSq >= 225) {
        // >= 15m
        return [round3(x), 1.0, round3(z)];
      }

      if (distSq > maxDistSq) {
        maxDistSq = distSq;
        bestPos = [round3(x), 1.0, round3(z)];
      }
    }

    return bestPos;
  }

  public step(input: InputState): void {
    stepWorld(this, input);
  }

  public getSnapshot(includeMotes = false): SnapshotOutput {
    // Entities sorted by ID
    const sortedLanterns = [...this.lanterns]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((l) => ({
        id: l.id,
        pos: roundVec3(l.pos),
        lit: l.lit,
        deposited: l.deposited,
      }));

    const sortedShades = [...this.shades]
      .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
      .map((s) => ({
        id: s.id,
        pos: roundVec3(s.pos),
        state: s.state,
      }));

    const activeMotes = this.motes.filter((m) => m.active);

    const snapshot: SnapshotOutput = {
      type: 'snapshot',
      tick: this.tick,
      sim_tick: this.sim_tick,
      state: this.state,
      time_left_s: round3(this.time_left_s),
      score: this.score,
      player: {
        pos: roundVec3(this.player.pos),
        flames: this.player.flames,
        carried: this.player.carried,
      },
      lanterns: sortedLanterns,
      shades: sortedShades,
      motes_active: activeMotes.length,
    };

    if (includeMotes) {
      snapshot.motes = [...activeMotes]
        .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
        .map((m) => ({
          id: m.id,
          pos: roundVec3(m.pos),
        }));
    }

    return snapshot;
  }
}
