export type Vec3 = [number, number, number];
export type Vec2 = [number, number];

export interface Player {
  pos: Vec3;
  velY: number;
  flames: number;
  carried: number;
  invuln_timer: number;
  pulse_cooldown_timer: number;
  prevButtons: {
    jump: boolean;
    interact: boolean;
    pulse: boolean;
  };
}

export interface Mote {
  id: string;
  pos: Vec3;
  active: boolean;
}

export interface Lantern {
  id: string;
  pos: Vec3;
  deposited: number;
  lit: boolean;
}

export interface Shade {
  id: string;
  pos: Vec3;
  state: 'chase' | 'stunned';
  stun_timer: number;
}

export interface InputState {
  move: Vec2;
  cam_yaw_deg: number;
  jump: boolean;
  interact: boolean;
  pulse: boolean;
}

export type SimEventName =
  | 'mote_picked'
  | 'deposit'
  | 'lantern_lit'
  | 'pulse'
  | 'player_hit'
  | 'shade_spawned'
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
  state: 'playing' | 'won' | 'lost';
  time_left_s: number;
  score: number;
  player: {
    pos: Vec3;
    flames: number;
    carried: number;
  };
  lanterns: {
    id: string;
    pos: Vec3;
    lit: boolean;
    deposited: number;
  }[];
  shades: {
    id: string;
    pos: Vec3;
    state: 'chase' | 'stunned';
  }[];
  motes_active: number;
  motes?: {
    id: string;
    pos: Vec3;
  }[];
}

export interface EndOutput {
  type: 'end';
  ticks: number;
  state: 'playing' | 'won' | 'lost';
  score: number;
}
