import * as THREE from 'three';
import { World } from '../core/world.js';
import { TUNING } from '../core/tuning.js';
import { createScene } from './scene.js';
import { createCamera, updateFollowCamera } from './camera.js';
import { RenderEntities } from './characters.js';
import { InputManager } from './input.js';
import { HudOverlay } from './hud.js';
import { MenuOverlay } from './menu.js';
import { loadSettings, saveSettings, GameSettings } from './settings.js';
import { GameAudio } from './audio.js';
import './style.css';

type ScreenMode = 'menu' | 'intro' | 'playing' | 'result';

class GameApp {
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private sceneCtx: ReturnType<typeof createScene>;
  private entities: RenderEntities;
  private input: InputManager;
  private hud: HudOverlay;
  private menu: MenuOverlay;
  private settings: GameSettings = loadSettings();
  private audio = new GameAudio();

  private world!: World;
  private currentNight: 1 | 2 | 3 = 1;
  private currentSeed: number = 42;
  private screenMode: ScreenMode = 'menu';
  private lastWorldState: string = 'playing';
  private wonNightScores: Map<1 | 2 | 3, number> = new Map();

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

    this.menu = new MenuOverlay({
      onSelectNight: (night) => this.openIntro(night),
      onStartIntroNight: () => this.startPlayingNight(this.currentNight),
      onResume: () => this.resumeFromPause(),
      onRetryNight: () => this.startPlayingNight(this.currentNight),
      onNextNight: () => {
        const next = Math.min(3, this.currentNight + 1) as 1 | 2 | 3;
        this.openIntro(next);
      },
      onBackToMenu: () => this.goToMainMenu(),
      onSettingsChange: (settings) => {
        this.settings = settings;
        saveSettings(settings);
        this.input.sensitivity = settings.sensitivity;
        this.audio.setVolume(settings.volume);
        document.body.classList.toggle('colorblind-mode', settings.colorblind);
      },
    }, this.settings);
    window.addEventListener('pointerdown', () => this.audio.unlock(), { once: true });
    window.addEventListener('keydown', () => this.audio.unlock(), { once: true });

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Dựng sẵn Đêm 1 làm khung nền 3D phía sau Menu chính
    this.loadWorld(1, this.currentSeed);
    this.goToMainMenu();
    this.loop();
  }

  private getTotalWonScore(): number {
    let sum = 0;
    for (const s of this.wonNightScores.values()) {
      sum += s;
    }
    return sum;
  }

  private loadWorld(night: 1 | 2 | 3, seed: number): void {
    this.currentNight = night;
    this.world = new World(seed, undefined, TUNING, night);
    this.sceneCtx.loadMap(this.world.map);
    this.entities.clearAll();
    this.input.yawDeg = 0;
    this.lastWorldState = this.world.state;
  }

  private goToMainMenu(): void {
    this.screenMode = 'menu';
    this.input.activeGameplay = false;
    this.input.clearKeys();
    this.input.releasePointerLock();
    this.hud.setVisible(false);
    this.menu.showMainMenu();
  }

  private openIntro(night: 1 | 2 | 3): void {
    this.currentSeed = Math.floor(Math.random() * 100000);
    this.loadWorld(night, this.currentSeed);
    this.screenMode = 'intro';
    this.input.activeGameplay = false;
    this.input.clearKeys();
    this.input.releasePointerLock();
    this.hud.setVisible(false);
    this.menu.showIntro(night);
  }

  private startPlayingNight(night: 1 | 2 | 3): void {
    this.currentSeed = Math.floor(Math.random() * 100000);
    this.loadWorld(night, this.currentSeed);
    this.screenMode = 'playing';
    this.input.clearKeys();
    this.input.activeGameplay = true;
    this.accumulator = 0;
    this.menu.hideAll();
    this.hud.setVisible(true);
  }

  private resumeFromPause(): void {
    if (this.screenMode === 'playing' && this.world.state === 'paused') {
      this.input.requestPauseToggle();
    }
  }

  private loop = (): void => {
    requestAnimationFrame(this.loop);

    const now = performance.now();
    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    if (dt > 0.1) dt = 0.1;
    this.animTime += dt;

    if (this.screenMode === 'playing') {
      this.accumulator += dt;

      if (this.input.consumeReset()) {
        this.startPlayingNight(this.currentNight);
      }

      // Fixed timestep 60Hz loop gọi đúng core.step()
      while (this.accumulator >= this.FIXED_STEP) {
        if (this.world.state === 'playing' || this.world.state === 'paused') {
          const inputFrame = this.input.pollInput();
          this.world.step(inputFrame);
          for (const event of this.world.events) this.audio.cue(event.name);
        }
        this.accumulator -= this.FIXED_STEP;
      }

      // Đồng bộ trạng thái Pause / Won / Lost giữa lõi và UI overlay
      if (this.world.state !== this.lastWorldState) {
        this.lastWorldState = this.world.state;
        if (this.world.state === 'paused') {
          this.input.releasePointerLock();
          this.menu.showPause();
        } else if (this.world.state === 'playing') {
          this.menu.hideAll();
        } else if (this.world.state === 'won') {
          this.wonNightScores.set(this.currentNight, this.world.score);
          this.screenMode = 'result';
          this.input.activeGameplay = false;
          this.input.releasePointerLock();
          this.menu.showResult({
            night: this.currentNight,
            won: true,
            nightScore: this.world.score,
            totalScore: this.getTotalWonScore(),
          });
        } else if (this.world.state === 'lost') {
          const reason =
            this.world.player.flames <= 0
              ? 'Mất hết Ngọn Lửa'
              : 'Hết thời gian (Bình minh đến)';
          this.screenMode = 'result';
          this.input.activeGameplay = false;
          this.input.releasePointerLock();
          this.menu.showResult({
            night: this.currentNight,
            won: false,
            nightScore: this.world.score,
            totalScore: this.getTotalWonScore(),
            lossReason: reason,
          });
        }
      }

      this.hud.update(this.world);
    }

    // Ánh sáng tăng dần theo số đèn sáng / tổng đèn
    const litCount = this.world.lanterns.filter((l) => l.lit).length;
    this.sceneCtx.updateLighting(litCount, this.world.lanterns.length);

    // Đồng bộ 3D entities với trạng thái lõi
    const animClock = this.world.state === 'paused' ? 0 : this.animTime;
    this.entities.syncPlayer(this.world.player, this.input.yawDeg, animClock);
    this.entities.syncLanterns(this.world.lanterns, animClock);
    this.entities.syncShades(
      this.world.shades,
      this.world.player,
      this.world.lanterns,
      this.world.tuning.safe_radius,
      animClock,
      this.settings.colorblind
    );
    this.entities.syncDrifters(this.world.drifters, this.world.player, animClock);
    this.entities.syncCharms(this.world.charms, animClock);
    this.entities.syncMotes(this.world.motes, animClock);

    // Camera bám sau người chơi
    updateFollowCamera(this.camera, this.world.player.pos, this.input.yawDeg);

    this.renderer.render(this.sceneCtx.scene, this.camera);
  };
}

new GameApp();
