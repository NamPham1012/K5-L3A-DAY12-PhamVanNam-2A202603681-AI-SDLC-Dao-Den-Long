import * as THREE from 'three';
import { World } from '../core/world.js';
import { PRNG } from '../core/rng.js';
import type { Shade, Mote } from '../core/entities.js';
import { createScene } from './scene.js';
import { RenderEntities } from './characters.js';
import { frameMetrics } from '../bench/metrics.js';

interface BenchBridge { firstFrame:()=>void; onLoadTime:(cb:(ms:number)=>void)=>void; measureStart:()=>void; benchDone:(data:unknown)=>void }
declare global { interface Window { desktop?: BenchBridge } }
export function startBench(): void {
  const bridge = window.desktop;
  if (!bridge) throw new Error('Benchmark requires Electron');
  const params = new URLSearchParams(location.search);
  const duration = Number(params.get('duration') ?? '30');
  const seed = Number(params.get('seed') ?? '42');
  const world = new World(seed, {random_motes:false,random_shades:false,random_drifters:false,motes:[],shades:[]});
  world.bench = true;
  world.lanterns.forEach((l,i) => { l.lit = i < 3; l.ever_lit = l.lit; l.fuel_u = l.lit ? 6000 : 0; });
  const rng = new PRNG(seed);
  const position = (): [number,number,number] => {
    for (;;) {
      const a = rng.next()*Math.PI*2, r = 38*Math.sqrt(rng.next()), x = r*Math.cos(a), z = r*Math.sin(a);
      if (world.lanterns.every(l => Math.hypot(x-l.pos[0], z-l.pos[2]) >= 6)) return [x,0,z];
    }
  };
  world.shades = Array.from({length:200}, (_, i):Shade => {
    const p = position();
    return {id:`S${i+1}`,pos:[p[0],1,p[2]],state:'wander',state_ticks_left:0,stun_timer:0,push_ticks_left:0,push_step:[0,0],recoil_step:[0,0],safe_push_ticks_left:0,safe_push_step:[0,0],interactable_from_tick:0};
  });
  world.motes = Array.from({length:100}, (_, i):Mote => ({id:`M${i+1}`,pos:position(),active:true,kind:'random',ttl_ticks:null,spawn_point_idx:null,interactable_from_tick:0}));
  const renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setSize(1280,720); renderer.setPixelRatio(1); document.body.appendChild(renderer.domElement);
  const scene = createScene(true); scene.loadMap(world.map); scene.updateLighting(3,5);
  const visuals = new RenderEntities(scene.scene), camera = new THREE.PerspectiveCamera(60,1280/720,0.1,200);
  const gl = renderer.getContext();
  const debug = gl.getExtension('WEBGL_debug_renderer_info');
  const rendererName = debug ? String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)) : String(gl.getParameter(gl.RENDERER));
  const timings = new Float64Array(1_000_000), timestamps = new Float64Array(1_000_000);
  const idle = {move:[0,0] as [number,number],cam_yaw_deg:0,jump:false,interact:false,pulse:false};
  let sampleCount = 0;
  let first = 0, previous = 0, lastStep = 0, loadMs = 0, measured = false, warmed = false;
  bridge.onLoadTime(ms => { loadMs = ms; });
  const frame = (now:number) => {
    if (!first) { first=now; previous=now; lastStep=now; bridge.firstFrame(); }
    const elapsed = (now-first)/1000;
    const steps = Math.min(2, Math.floor((now-lastStep)/(1000/60)));
    for (let i=0;i<steps;i++) world.step(idle);
    lastStep += steps * 1000/60;
    if (now-lastStep > 1000/60*2) lastStep=now;
    const angle = 2*Math.PI*elapsed/15;
    camera.position.set(30*Math.cos(angle),15,30*Math.sin(angle)); camera.lookAt(0,0,0);
    visuals.syncPlayer(world.player,0,elapsed); visuals.syncLanterns(world.lanterns,elapsed);
    visuals.syncShades(world.shades,world.player,world.lanterns,world.tuning.safe_radius,elapsed);
    visuals.syncMotes(world.motes,elapsed);
    if (!warmed) {
      renderer.compile(scene.scene, camera);
      for (let i=0;i<4;i++) { const a=i*Math.PI/2; camera.position.set(30*Math.cos(a),15,30*Math.sin(a)); camera.lookAt(0,0,0); renderer.render(scene.scene,camera); }
      camera.position.set(30*Math.cos(angle),15,30*Math.sin(angle)); camera.lookAt(0,0,0);
      warmed=true;
    }
    renderer.render(scene.scene,camera);
    if (elapsed >= 3 && !measured) { measured=true; previous=now; bridge.measureStart(); }
    else if (measured && sampleCount < timings.length) { timings[sampleCount]=now-previous; timestamps[sampleCount]=elapsed-3; sampleCount++; }
    previous=now;
    if (elapsed >= 3+duration && sampleCount) {
      const samples=Array.from(timings.subarray(0,sampleCount));
      const slowest=samples.map((dt,i)=>({time_s:timestamps[i],dt_ms:dt})).sort((a,b)=>b.dt_ms-a.dt_ms).slice(0,20);
      bridge.benchDone({...frameMetrics(samples),slowest_frames:slowest,load_ms:loadMs,renderer:`Three.js r${THREE.REVISION}; ${rendererName}`}); return;
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
