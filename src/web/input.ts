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
        // Giữ nguyên chiều xoay chuột
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

    // Camera nhìn hướng (sinθ, 0, cosθ), nên hướng phải màn hình là (-cosθ, 0, sinθ).
    // Test Contract map move.x = +1 thành (+cosθ, 0, -sinθ) (bên trái màn hình),
    // nên cần đổi dấu thành -right ở lớp web để phím D đi sang phải, A đi sang trái.
    let mx = -right;
    let mz = forward;
    const lenSq = mx * mx + mz * mz;
    if (lenSq > 1.0) {
      const len = Math.sqrt(lenSq);
      mx /= len;
      mz /= len;
    }
    const move: Vec2 = [mx, mz];

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
