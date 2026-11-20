import { InputState, Vec2 } from '../core/entities.js';

export class InputManager {
  private keys: Set<string> = new Set();
  public yawDeg: number = 0;
  private isPointerLocked: boolean = false;
  public resetTriggered: boolean = false;

  constructor(domElement: HTMLElement) {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      if (e.code === 'KeyR') {
        this.resetTriggered = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });

    domElement.addEventListener('click', () => {
      if (!this.isPointerLocked) {
        domElement.requestPointerLock?.();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === domElement;
    });

    document.addEventListener('mousemove', (e) => {
      if (this.isPointerLocked) {
        this.yawDeg -= e.movementX * 0.15;
      }
    });
  }

  public pollInput(): InputState {
    let forward = 0;
    let right = 0;

    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) forward += 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) forward -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) right += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) right -= 1;

    let move: Vec2 = [right, forward];
    const lenSq = right * right + forward * forward;
    if (lenSq > 1.0) {
      const len = Math.sqrt(lenSq);
      move = [right / len, forward / len];
    }

    const jump = this.keys.has('Space');
    const interact = this.keys.has('KeyE');
    const pulse = this.keys.has('KeyQ');

    return {
      move,
      cam_yaw_deg: this.yawDeg,
      jump,
      interact,
      pulse,
    };
  }

  public consumeReset(): boolean {
    if (this.resetTriggered) {
      this.resetTriggered = false;
      return true;
    }
    return false;
  }
}
