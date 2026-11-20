import { PRNG } from './rng.js';
import { TUNING, TuningConfig } from './tuning.js';
import {
  Player,
  Mote,
  Lantern,
  Shade,
  ShadeState,
  Drifter,
  DrifterState,
  Charm,
  WindState,
  SimEvent,
  SnapshotOutput,
  InputState,
  WorldState,
  Vec3,
} from './entities.js';
import { NightMap, getMapForNight } from './maps/index.js';
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
    invuln_ticks?: number;
    dash_cd_ticks?: number;
    pulse_cd_ticks?: number;
    charm_ticks?: number;
    successful_lights?: number;
  };
  random_motes?: boolean;
  random_shades?: boolean;
  random_drifters?: boolean;
  wind_enabled?: boolean;
  motes?: Vec3[];
  shades?: {
    id?: string;
    pos: Vec3;
    state?: ShadeState;
    state_ticks_left?: number;
    target_lantern_id?: string;
  }[];
  drifters?: {
    id?: string;
    pos: Vec3;
    state?: DrifterState;
    stolen?: number;
  }[];
  charms?: {
    id: string;
    pos?: Vec3;
    available?: boolean;
    respawn_ticks?: number;
  }[];
  lanterns?: { id: string; pos?: Vec3; lit?: boolean; deposited?: number; fuel?: number; ever_lit?: boolean }[];
  time_left_s?: number;
}

export class World {
  public bench = false;
  public night: 1 | 2 | 3;
  public map: NightMap;
  public tick: number = 0;
  public sim_tick: number = 0;
  public initial_duration_s: number;
  public time_left_s: number;
  public score: number = 0;
  public state: WorldState = 'playing';

  public player: Player;
  public lanterns: Lantern[] = [];
  public motes: Mote[] = [];
  public shades: Shade[] = [];
  public drifters: Drifter[] = [];
  public charms: Charm[] = [];
  public wind: WindState = { active: false, dir_deg: 0, ticks_left: 0 };

  public rng: PRNG;
  public moteCounter: number = 1;
  public shadeCounter: number = 1;
  public drifterCounter: number = 1;

  public random_motes: boolean = true;
  public random_shades: boolean = true;
  public random_drifters: boolean = true;
  public wind_enabled: boolean = true;

  public events: SimEvent[] = [];
  public tuning: TuningConfig;

  constructor(
    seed: number,
    scenario?: ScenarioData,
    tuning: TuningConfig = TUNING,
    night: 1 | 2 | 3 = 1
  ) {
    this.night = night;
    this.map = getMapForNight(night);
    this.tuning = tuning;
    this.rng = new PRNG(seed);

    this.initial_duration_s = scenario?.time_left_s ?? [tuning.night1_duration_s, tuning.night2_duration_s, tuning.night3_duration_s][night - 1];
    this.time_left_s = this.initial_duration_s;

    if (scenario?.random_motes !== undefined) {
      this.random_motes = scenario.random_motes;
    }
    if (scenario?.random_shades !== undefined) {
      this.random_shades = scenario.random_shades;
    }
    if (scenario?.random_drifters !== undefined) {
      this.random_drifters = scenario.random_drifters;
    }
    if (scenario?.wind_enabled !== undefined) {
      this.wind_enabled = scenario.wind_enabled;
    }

    // 1. Player setup (giữ nguyên độ cao theo scenario nếu có)
    const startPos: Vec3 = scenario?.player?.pos
      ? [scenario.player.pos[0], scenario.player.pos[1], scenario.player.pos[2]]
      : [this.map.startPos[0], this.map.startPos[1], this.map.startPos[2]];
    const groundY = this.map.groundHeight(startPos[0], startPos[2], startPos[1]);
    const grounded = groundY !== null && Math.abs(startPos[1] - groundY) <= 0.01;

    const invulnTicks = scenario?.player?.invuln_ticks ?? 0;
    const dashCdTicks = scenario?.player?.dash_cd_ticks ?? 0;
    const pulseCdTicks = scenario?.player?.pulse_cd_ticks ?? 0;
    const charmTicks = scenario?.player?.charm_ticks ?? 0;

    this.player = {
      pos: startPos,
      vel: [0, 0, 0],
      velY: 0,
      grounded,
      facing: [this.map.startFacing[0], this.map.startFacing[1]],
      flames: scenario?.player?.flames ?? tuning.flames,
      carried: scenario?.player?.carried ?? 0,
      successful_lights: scenario?.player?.successful_lights ?? 0,
      invuln_ticks: invulnTicks,
      invuln_timer: invulnTicks / 60,
      dash_ticks_left: 0,
      dash_dir: [this.map.startFacing[0], this.map.startFacing[1]],
      dash_cd_ticks: dashCdTicks,
      pulse_cd_ticks: pulseCdTicks,
      pulse_cooldown_timer: pulseCdTicks / 60,
      charm_ticks: charmTicks,
      fall_respawn_ticks: 0,
      launch_vel: null,
      prevButtons: {
        jump: false,
        interact: false,
        pulse: false,
        dash: false,
        pause: false,
      },
    };

    // 2. Lanterns setup
    this.initLanterns(scenario?.lanterns);

    // 3. Motes setup (20 điểm khác nhau trên tập điểm sinh cố định của Đêm)
    this.initMotes(scenario?.motes);

    // 4. Shades setup (0 lúc tick 0 theo Ticket-02; sinh 2 con tại tick 300)
    this.initShades(scenario?.shades);

    // 5. Drifters setup
    this.initDrifters(scenario?.drifters);

    // 6. Charms setup
    this.initCharms(scenario?.charms);
  }

  private initLanterns(scenarioLanterns?: ScenarioData['lanterns']): void {
    const defaultLanterns: Lantern[] = this.map.lanterns.map((l) => ({
      id: l.id,
      pos: [l.pos[0], l.pos[1], l.pos[2]],
      deposited: 0,
      lit: false,
      fuel_u: 0,
      ever_lit: false,
      relit_count: 0,
    }));

    if (scenarioLanterns) {
      for (const override of scenarioLanterns) {
        const found = defaultLanterns.find((l) => l.id === override.id);
        if (found) {
          if (override.pos) found.pos = [override.pos[0], override.pos[1], override.pos[2]];
          if (override.deposited !== undefined) found.deposited = override.deposited;
          if (override.lit !== undefined) found.lit = override.lit;
          found.ever_lit = override.ever_lit ?? found.lit;
          found.fuel_u = found.lit ? Math.round((override.fuel ?? 100) * 60) : 0;
        }
      }
    }

    this.lanterns = defaultLanterns;
  }

  private initMotes(scenarioMotes?: Vec3[]): void {
    if (scenarioMotes !== undefined) {
      this.motes = scenarioMotes.map((pos) => ({
        id: `M${this.moteCounter++}`,
        pos: [pos[0], pos[1], pos[2]],
        active: true,
        kind: 'random',
        ttl_ticks: null,
        spawn_point_idx: null,
        interactable_from_tick: 0,
      }));
      return;
    }

    // Mặc định Ticket-02: chọn 20 điểm khác nhau trong tập điểm sinh cố định của Đêm
    if (this.random_motes) {
      const availableIndices = this.map.moteSpawnPoints.map((_, idx) => idx);
      const count = Math.min(20, availableIndices.length);
      for (let i = 0; i < count; i++) {
        const pick = this.rng.nextInt(0, availableIndices.length - 1);
        const ptIdx = availableIndices.splice(pick, 1)[0];
        const pt = this.map.moteSpawnPoints[ptIdx];
        this.motes.push({
          id: `M${this.moteCounter++}`,
          pos: [pt[0], pt[1], pt[2]],
          active: true,
          kind: 'random',
          ttl_ticks: null,
          spawn_point_idx: ptIdx,
          interactable_from_tick: 0,
        });
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
        const st: ShadeState = s.state ?? 'wander';
        const ticksLeft = s.state_ticks_left ?? 0;
        return {
          id: shadeId,
          pos: [s.pos[0], s.pos[1], s.pos[2]],
          state: st,
          target_lantern_id: s.target_lantern_id,
          drain_ticks: 0,
          state_ticks_left: ticksLeft,
          stun_timer: st === 'stunned' ? ticksLeft / 60 : 0,
          push_ticks_left: 0,
          push_step: [0, 0],
          recoil_step: [0, 0],
          safe_push_ticks_left: 0,
          safe_push_step: [0, 0],
          interactable_from_tick: 0,
        };
      });
      return;
    }

    // Ticket-02 FR2-020: 0 shade tại tick 0; 2 con đầu sinh tại tick 300.
    this.shades = [];
  }

  private initDrifters(scenarioDrifters?: ScenarioData['drifters']): void {
    if (scenarioDrifters !== undefined) {
      this.drifters = scenarioDrifters.map((d) => {
        let drifterId = d.id;
        if (!drifterId) {
          drifterId = `D${this.drifterCounter++}`;
        } else {
          const match = drifterId.match(/^D(\d+)$/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num >= this.drifterCounter) {
              this.drifterCounter = num + 1;
            }
          }
        }
        return {
          id: drifterId,
          pos: [d.pos[0], d.pos[1], d.pos[2]],
          state: d.state ?? 'idle',
          stolen: d.stolen ?? 0,
          stolen_once: (d.stolen ?? 0) > 0,
          timer_ticks: 0,
          spawn_pos: [d.pos[0], d.pos[1], d.pos[2]],
          interactable_from_tick: 0,
        };
      });
      return;
    }
    this.drifters = [];
  }

  private initCharms(scenarioCharms?: ScenarioData['charms']): void {
    if (scenarioCharms !== undefined) {
      this.charms = scenarioCharms.map((c) => ({
        id: c.id,
        pos: c.pos ? [c.pos[0], c.pos[1], c.pos[2]] : [0, 0, 0],
        available: c.available ?? true,
        respawn_ticks: c.respawn_ticks ?? 0,
      }));
      return;
    }

    this.charms = this.map.charms.map((c) => ({
      id: c.id,
      pos: [c.pos[0], c.pos[1], c.pos[2]],
      available: true,
      respawn_ticks: 0,
    }));
  }

  public findValidShadeSpawnPos(): Vec3 | null {
    const validPoints = this.map.shadeSpawnPoints.filter((pt) => {
      const dx = pt[0] - this.player.pos[0];
      const dz = pt[2] - this.player.pos[2];
      return dx * dx + dz * dz >= 15 * 15;
    });

    if (validPoints.length === 0) {
      return null;
    }

    const pick = this.rng.nextInt(0, validPoints.length - 1);
    const chosen = validPoints[pick];
    return [chosen[0], chosen[1] + 1.0, chosen[2]];
  }

  public step(input: InputState): void {
    stepWorld(this, input);
  }

  public getSnapshot(): SnapshotOutput {
    const sortedLanterns = [...this.lanterns]
      .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
      .map((l) => ({
        id: l.id,
        pos: roundVec3(l.pos),
        lit: l.lit,
        deposited: l.deposited,
        fuel: l.lit ? Math.round(l.fuel_u / 6) / 10 : 0,
        ever_lit: l.ever_lit,
        relit_count: l.relit_count,
      }));

    const sortedShades = [...this.shades]
      .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
      .map((s) => ({
        id: s.id,
        pos: roundVec3(s.pos),
        state: s.state,
      }));

    const activeMotes = this.motes
      .filter((m) => m.active)
      .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

    const sortedDrifters = [...this.drifters]
      .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
      .map((d) => ({
        id: d.id,
        pos: roundVec3(d.pos),
        state: d.state,
        stolen: d.stolen,
      }));

    const sortedCharms = [...this.charms]
      .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
      .map((c) => ({
        id: c.id,
        available: c.available,
        respawn_s: round3(c.respawn_ticks / 60),
      }));

    return {
      type: 'snapshot',
      tick: this.tick,
      sim_tick: this.sim_tick,
      night: this.night,
      state: this.state,
      time_left_s: round3(this.time_left_s),
      score: this.score,
      wind: {
        active: this.wind.active,
        dir_deg: round3(this.wind.dir_deg),
      },
      player: {
        pos: roundVec3(this.player.pos),
        vel: roundVec3(this.player.vel),
        grounded: this.player.grounded,
        flames: this.player.flames,
        carried: this.player.carried,
        capacity: Math.min(this.tuning.capacity_max, this.tuning.carry_capacity + 2 * this.player.successful_lights),
        invuln: round3(this.player.invuln_ticks / 60),
        dash_cd_s: round3(this.player.dash_cd_ticks / 60),
        pulse_cd_s: round3(this.player.pulse_cd_ticks / 60),
        charm_s: round3(this.player.charm_ticks / 60),
      },
      lanterns: sortedLanterns,
      shades: sortedShades,
      motes_active: activeMotes.length,
      motes: activeMotes.map((m) => ({
        id: m.id,
        pos: roundVec3(m.pos),
        kind: m.kind,
        ttl_s: m.ttl_ticks === null ? null : round3(m.ttl_ticks / 60),
      })),
      drifters: sortedDrifters,
      charms: sortedCharms,
    };
  }
}
