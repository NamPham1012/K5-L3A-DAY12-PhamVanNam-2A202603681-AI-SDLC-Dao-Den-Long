import * as THREE from 'three';
import { World } from '../core/world.js';
import { createScene } from './scene.js';
import { createCamera, updateFollowCamera } from './camera.js';
import { RenderEntities } from './characters.js';
import { InputManager } from './input.js';
import { HudOverlay } from './hud.js';
import './style.css';

class GameApp {
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private sceneCtx: ReturnType<typeof createScene>;
  private entities: RenderEntities;
  private input: InputManager;
  private hud: HudOverlay;
  private world!: World;
  private currentSeed: number = 42;

  private lastTime: number = performance.now();
  private accumulator: number = 0;
  private animTime: number = 0;
  private readonly FIXED_STEP: number = 1 / 60;

  constructor() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.body.appendChild(this.renderer.domElement);

    this.sceneCtx = createScene();
    this.camera = createCamera();
    this.entities = new RenderEntities(this.sceneCtx.scene);
    this.input = new InputManager(this.renderer.domElement);
    this.hud = new HudOverlay();

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    this.startNewGame(this.currentSeed);
    this.loop();
  }

  private startNewGame(seed: number): void {
    this.world = new World(seed);
    this.entities.clearAll();
    this.input.yawDeg = 0;
  }

  private loop = (): void => {
    requestAnimationFrame(this.loop);

    const now = performance.now();
    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    if (dt > 0.1) dt = 0.1;
    this.accumulator += dt;
    this.animTime += dt;

    if (this.input.consumeReset()) {
      this.currentSeed = Math.floor(Math.random() * 100000);
      this.startNewGame(this.currentSeed);
      this.accumulator = 0;
    }

    // Fixed timestep 60Hz loop calling pure core.step()
    while (this.accumulator >= this.FIXED_STEP) {
      const inputFrame = this.input.pollInput();
      this.world.step(inputFrame);
      this.accumulator -= this.FIXED_STEP;
    }

    // Đảo sáng dần theo số đèn đã thắp (0 -> 5)
    const litCount = this.world.lanterns.filter((l) => l.lit).length;
    this.sceneCtx.updateLighting(litCount);

    // Đồng bộ hiển thị 3D với trạng thái lõi
    this.entities.syncPlayer(this.world.player, this.input.yawDeg, this.animTime);
    this.entities.syncLanterns(this.world.lanterns, this.animTime);
    this.entities.syncShades(
      this.world.shades,
      this.world.player,
      this.world.lanterns,
      this.world.tuning.safe_radius,
      this.animTime
    );
    this.entities.syncMotes(this.world.motes, this.animTime);

    // Cập nhật camera bám sau
    updateFollowCamera(this.camera, this.world.player.pos, this.input.yawDeg);

    // Cập nhật HUD
    this.hud.update(this.world);

    // Render
    this.renderer.render(this.sceneCtx.scene, this.camera);
  };
}

new GameApp();
