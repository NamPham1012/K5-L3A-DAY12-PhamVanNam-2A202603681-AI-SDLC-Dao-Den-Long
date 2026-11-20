export type Vec3 = [number, number, number];
export type Vec2 = [number, number];

export type ShadeState = 'spawning' | 'wander' | 'chase' | 'recoil' | 'stunned' | 'drain';
export type DrifterState = 'idle' | 'chase' | 'flee' | 'removed';
export type WorldState = 'playing' | 'paused' | 'won' | 'lost';

export interface Player {
  pos: Vec3;
  vel: Vec3;
  velY: number;
  grounded: boolean;
  facing: Vec2;
  flames: number;
  carried: number;
  successful_lights: number;
  invuln_ticks: number;
  invuln_timer: number;
  dash_ticks_left: number;
  dash_dir: Vec2;
  dash_cd_ticks: number;
  pulse_cd_ticks: number;
  pulse_cooldown_timer: number;
  charm_ticks: number;
  fall_respawn_ticks: number;
  launch_vel: Vec2 | null;
  prevButtons: {
    jump: boolean;
    interact: boolean;
    pulse: boolean;
    dash: boolean;
    pause: boolean;
  };
}

export interface Mote {
  id: string;
  pos: Vec3;
  active: boolean;
  kind: 'random' | 'dropped';
  ttl_ticks: number | null;
  spawn_point_idx: number | null;
  interactable_from_tick: number;
}

export interface Lantern {
  id: string;
  pos: Vec3;
  deposited: number;
  lit: boolean;
  fuel_u: number;
  ever_lit: boolean;
  relit_count: number;
}

export interface Shade {
  id: string;
  pos: Vec3;
  state: ShadeState;
  state_ticks_left: number;
  stun_timer: number;
  push_ticks_left: number;
  push_step: Vec2;
  recoil_step: Vec2;
  safe_push_ticks_left: number;
  safe_push_step: Vec2;
  interactable_from_tick: number;
  target_lantern_id?: string;
  drain_ticks?: number;
}

export interface Drifter {
  id: string;
  pos: Vec3;
  state: DrifterState;
  stolen: number;
  stolen_once: boolean;
  timer_ticks: number;
  spawn_pos: Vec3;
  interactable_from_tick: number;
}

export interface Charm {
  id: string;
  pos: Vec3;
  available: boolean;
  respawn_ticks: number;
}

export interface WindState {
  active: boolean;
  dir_deg: number;
  ticks_left: number;
}

export interface InputState {
  move: Vec2;
  cam_yaw_deg: number;
  jump: boolean;
  interact: boolean;
  pulse: boolean;
  dash?: boolean;
  pause?: boolean;
}

export type SimEventName =
  | 'night_start'
  | 'mote_picked'
  | 'deposit'
  | 'lantern_lit'
  | 'lantern_out'
  | 'fuel_drain'
  | 'refuel'
  | 'pulse'
  | 'dash'
  | 'charm_picked'
  | 'drifter_steal'
  | 'drifter_drop'
  | 'player_hit'
  | 'shade_spawned'
  | 'paused'
  | 'resumed'
  | 'game_over';

export interface SimEvent {
  type: 'event';
  tick: number;
  name: SimEventName;
  data: Record<string, unknown>;
}

export interface SnapshotOutput {
  type: 'snapshot';
  tick: number;
  sim_tick: number;
  night: number;
  state: WorldState;
  time_left_s: number;
  score: number;
  wind: {
    active: boolean;
    dir_deg: number;
  };
  player: {
    pos: Vec3;
    vel: Vec3;
    grounded: boolean;
    flames: number;
    carried: number;
    capacity: number;
    invuln: number;
    dash_cd_s: number;
    pulse_cd_s: number;
    charm_s: number;
  };
  lanterns: {
    id: string;
    pos: Vec3;
    lit: boolean;
    deposited: number;
    fuel: number;
    ever_lit: boolean;
    relit_count: number;
  }[];
  shades: {
    id: string;
    pos: Vec3;
    state: ShadeState;
  }[];
  motes_active: number;
  motes: {
    id: string;
    pos: Vec3;
    kind: 'random' | 'dropped';
    ttl_s: number | null;
  }[];
  drifters: {
    id: string;
    pos: Vec3;
    state: DrifterState;
    stolen: number;
  }[];
  charms: {
    id: string;
    available: boolean;
    respawn_s: number;
  }[];
}

export interface EndOutput {
  type: 'end';
  ticks: number;
  state: WorldState;
  score: number;
}
