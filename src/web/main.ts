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

    // Cap dt to prevent spiral of death on lag
    if (dt > 0.1) dt = 0.1;
    this.accumulator += dt;

    if (this.input.consumeReset()) {
      this.currentSeed = Math.floor(Math.random() * 100000);
      this.startNewGame(this.currentSeed);
      this.accumulator = 0;
    }

    // Fixed timestep 60Hz loop calling pure core.step()
    while (this.accumulator >= this.FIX_STEP) {
      const inputFrame = this.input.pollInput();
      this.world.step(inputFrame);
      this.accumulator -= this.FIX_STEP;
    }

    // Sync graphics with core state
    this.entities.syncPlayer(this.world.player, this.input.yawDeg);
    this.entities.syncLanterns(this.world.lanterns);
    this.entities.syncShades(this.world.shades);
    this.entities.syncMotes(this.world.motes);

    // Update follow camera
    updateFollowCamera(this.camera, this.world.player.pos, this.input.yawDeg);

    // Update UI HUD
    this.hud.update(this.world);

    // Render 3D Scene
    this.renderer.render(this.sceneCtx.scene, this.camera);
  };

  private get FIX_STEP(): number {
    return this.FIXED_STEP;
  }
}

new GameApp();
