import { InputState, Vec2 } from '../core/entities.js';
import { DEFAULT_KEYS, KeyBindings } from './settings.js';

export class InputManager {
  private keys: Set<string> = new Set();
  public yawDeg: number = 0;
  public sensitivity: number = 1;
  public bindings: KeyBindings = {...DEFAULT_KEYS};
  public hintTriggered = false;
  private isPointerLocked: boolean = false;
  public resetTriggered: boolean = false;
  private pausePulsePending: boolean = false;
  private pauseWasSent: boolean = false;
  private domElement: HTMLElement;
  public activeGameplay: boolean = false;

  constructor(domElement: HTMLElement) {
    this.domElement = domElement;

    window.addEventListener('keydown', (e) => {
      if (!this.activeGameplay) return;
      this.keys.add(e.code);

      if (e.code === 'KeyR') {
        this.resetTriggered = true;
      }
      if (e.code === this.bindings.hint && !e.repeat) this.hintTriggered = true;
      if (e.code === this.bindings.pause && !e.repeat) {
        this.requestPauseToggle();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });

    domElement.addEventListener('click', () => {
      if (this.activeGameplay && !this.isPointerLocked) {
        domElement.requestPointerLock?.();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === domElement;
    });

    document.addEventListener('mousemove', (e) => {
      if (this.activeGameplay && this.isPointerLocked) {
        // Giữ nguyên chiều xoay chuột
        this.yawDeg -= e.movementX * 0.15 * this.sensitivity;
      }
    });
  }

  public requestPauseToggle(): void {
    this.pausePulsePending = true;
  }

  public releasePointerLock(): void {
    if (document.pointerLockElement === this.domElement) {
      document.exitPointerLock?.();
    }
  }

  public clearKeys(): void {
    this.keys.clear();
    this.pausePulsePending = false;
    this.pauseWasSent = false;
    this.resetTriggered = false;
  }

  public pollInput(): InputState {
    let forward = 0;
    let right = 0;

    if (this.keys.has(this.bindings.forward)) forward += 1;
    if (this.keys.has(this.bindings.back)) forward -= 1;
    if (this.keys.has(this.bindings.right)) right += 1;
    if (this.keys.has(this.bindings.left)) right -= 1;

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

    const jump = this.keys.has(this.bindings.jump);
    const interact = this.keys.has(this.bindings.interact);
    const pulse = this.keys.has(this.bindings.pulse);
    const dash = this.keys.has(this.bindings.dash);

    // Gửi cạnh lên 1 tick cho input.pause rồi tự nhả false ở tick sau
    let pause = false;
    if (this.pausePulsePending && !this.pauseWasSent) {
      pause = true;
      this.pausePulsePending = false;
      this.pauseWasSent = true;
    } else {
      this.pauseWasSent = false;
    }

    return {
      move,
      cam_yaw_deg: this.yawDeg,
      jump,
      interact,
      pulse,
      dash,
      pause,
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
