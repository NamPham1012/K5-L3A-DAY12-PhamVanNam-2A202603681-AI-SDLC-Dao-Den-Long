import fs from 'node:fs';
import { InputState, Vec2 } from '../core/entities.js';

export interface RawInputFrame {
  tick: number;
  move?: [number, number];
  cam_yaw_deg?: number;
  jump?: boolean;
  interact?: boolean;
  pulse?: boolean;
}

export interface RawInputData {
  frames?: RawInputFrame[];
}

export class InputParser {
  private frames: RawInputFrame[] = [];

  constructor(filePath?: string) {
    if (filePath) {
      this.loadFile(filePath);
    }
  }

  public loadFile(filePath: string): void {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Input file not found: ${filePath}`);
    }
    let data: RawInputData;
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      data = JSON.parse(content);
    } catch {
      throw new Error(`Invalid JSON in input file: ${filePath}`);
    }

    this.parse(data);
  }

  public parse(data: RawInputData): void {
    if (typeof data !== 'object' || data === null || !Array.isArray(data.frames)) {
      throw new Error('Input must contain a frames array');
    }

    let prevTick = -1;
    for (const frame of data.frames) {
      if (typeof frame !== 'object' || frame === null) {
        throw new Error('Each frame must be an object');
      }
      if (typeof frame.tick !== 'number' || !Number.isInteger(frame.tick) || frame.tick < 0) {
        throw new Error(`Invalid tick in frame: ${JSON.stringify(frame)}`);
      }
      if (frame.tick <= prevTick) {
        throw new Error(`Frame tick must be strictly increasing: ${frame.tick} <= ${prevTick}`);
      }
      prevTick = frame.tick;

      if (frame.move !== undefined) {
        if (!Array.isArray(frame.move) || frame.move.length !== 2) {
          throw new Error('move must be a 2-element array');
        }
        const [x, z] = frame.move;
        if (typeof x !== 'number' || typeof z !== 'number') {
          throw new Error('move elements must be numbers');
        }
        if (x < -1 || x > 1 || z < -1 || z > 1) {
          throw new Error(`move components must be in [-1, 1], got [${x}, ${z}]`);
        }
      }

      if (frame.cam_yaw_deg !== undefined && typeof frame.cam_yaw_deg !== 'number') {
        throw new Error('cam_yaw_deg must be a number');
      }
      if (frame.jump !== undefined && typeof frame.jump !== 'boolean') {
        throw new Error('jump must be a boolean');
      }
      if (frame.interact !== undefined && typeof frame.interact !== 'boolean') {
        throw new Error('interact must be a boolean');
      }
      if (frame.pulse !== undefined && typeof frame.pulse !== 'boolean') {
        throw new Error('pulse must be a boolean');
      }
    }

    this.frames = data.frames;
  }

  /**
   * Builds an array of InputState for each tick from 0 to maxTicks - 1.
   */
  public buildTimeline(maxTicks: number): InputState[] {
    const timeline: InputState[] = [];
    let currentMove: Vec2 = [0, 0];
    let currentYaw = 0;
    let currentJump = false;
    let currentInteract = false;
    let currentPulse = false;

    let frameIdx = 0;

    for (let t = 0; t < maxTicks; t++) {
      while (frameIdx < this.frames.length && this.frames[frameIdx].tick === t) {
        const frame = this.frames[frameIdx];
        if (frame.move !== undefined) {
          let [x, z] = frame.move;
          const lenSq = x * x + z * z;
          if (lenSq > 1.0) {
            const len = Math.sqrt(lenSq);
            x = x / len;
            z = z / len;
          }
          currentMove = [x, z];
        }
        if (frame.cam_yaw_deg !== undefined) {
          currentYaw = frame.cam_yaw_deg;
        }
        if (frame.jump !== undefined) {
          currentJump = frame.jump;
        }
        if (frame.interact !== undefined) {
          currentInteract = frame.interact;
        }
        if (frame.pulse !== undefined) {
          currentPulse = frame.pulse;
        }
        frameIdx++;
      }

      timeline.push({
        move: [currentMove[0], currentMove[1]],
        cam_yaw_deg: currentYaw,
        jump: currentJump,
        interact: currentInteract,
        pulse: currentPulse,
      });
    }

    return timeline;
  }
}
