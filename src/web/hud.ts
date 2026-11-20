import { World } from '../core/world.js';
import * as THREE from 'three';

function formatTimeMMSS(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export class HudOverlay {
  private container: HTMLDivElement;
  private flamesEl: HTMLElement;
  private nightEl: HTMLElement;
  private timeCardEl: HTMLElement;
  private timeEl: HTMLElement;
  private lanternsEl: HTMLElement;
  private scoreEl: HTMLElement;
  private motesEl: HTMLElement;
  private dashEl: HTMLElement;
  private pulseEl: HTMLElement;
  private promptEl: HTMLElement;
  private subtitleEl: HTMLElement;
  private arrowEl: HTMLElement;
  private marker = new THREE.Vector3();
  private messageUntil = 0;
  private arrowUntil = 0;
  private target = new THREE.Vector3();
  private warnedLanterns = new Set<string>();
  private warnedCountdown = false;
  private warnedWindTick = -1;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'hud';
    this.container.classList.add('hidden');
    this.container.innerHTML = `
      <div class="hud-top">
        <div class="hud-card">🔥 <span id="hud-flames">🔥🔥🔥</span></div>
        <div class="hud-card"><span id="hud-night">Đêm 1</span></div>
        <div id="hud-time-card" class="hud-card">⏳ <span id="hud-time">05:00</span></div>
        <div class="hud-card">🏮 <span id="hud-lanterns">0/5</span> · 🏆 <span id="hud-score">0</span></div>
      </div>
      <div id="hud-prompt" class="hud-prompt hidden">E — Nạp ánh sáng (0/10)</div>
      <div id="hud-subtitle" class="hud-subtitle hidden" role="status" aria-live="polite"></div>
      <div id="hud-shade-arrow" class="hud-shade-arrow hidden" aria-label="Hướng Bóng Mực mới xuất hiện">▲</div>
      <div class="hud-bottom">
        <div class="hud-card">✨ Đom đóm: <span id="hud-motes">0/10</span></div>
        <div class="hud-card">💨 Lướt (Shift): <span id="hud-dash">SẴN SÀNG</span></div>
        <div class="hud-card">⚡ Tỏa Sáng (Q): <span id="hud-pulse">SẴN SÀNG</span></div>
      </div>
    `;
    document.body.appendChild(this.container);

    this.flamesEl = document.getElementById('hud-flames')!;
    this.nightEl = document.getElementById('hud-night')!;
    this.timeCardEl = document.getElementById('hud-time-card')!;
    this.timeEl = document.getElementById('hud-time')!;
    this.lanternsEl = document.getElementById('hud-lanterns')!;
    this.scoreEl = document.getElementById('hud-score')!;
    this.motesEl = document.getElementById('hud-motes')!;
    this.dashEl = document.getElementById('hud-dash')!;
    this.pulseEl = document.getElementById('hud-pulse')!;
    this.promptEl = document.getElementById('hud-prompt')!;
    this.subtitleEl = document.getElementById('hud-subtitle')!;
    this.arrowEl = document.getElementById('hud-shade-arrow')!;
  }

  public setVisible(visible: boolean): void {
    if (visible) {
      this.container.classList.remove('hidden');
    } else {
      this.container.classList.add('hidden');
    }
  }

  public resetAlerts(): void { this.warnedLanterns.clear(); this.warnedCountdown=false; this.warnedWindTick=-1; this.messageUntil=0; this.arrowUntil=0; this.arrowEl.classList.add('hidden'); this.subtitleEl.classList.add('hidden'); }

  public notifySpawn(world:World, id:string):void {
    const shade=world.shades.find(s=>s.id===id); if(!shade) return;
    this.target.set(...shade.pos); this.arrowUntil=performance.now()+4000;
    this.notify('Bóng Mực xuất hiện');
  }
  private notify(text:string):void { this.subtitleEl.textContent=text; this.subtitleEl.classList.remove('hidden'); this.messageUntil=performance.now()+2500; }

  public update(world: World, camera?: THREE.Camera): void {
    const p = world.player;
    const now=performance.now();
    if(now>this.messageUntil) this.subtitleEl.classList.add('hidden');
    if(world.state==='playing' && world.night===3 && world.wind_enabled && !world.wind.active && world.sim_tick>0 && (world.sim_tick+120)%1800===0 && this.warnedWindTick!==world.sim_tick) { this.warnedWindTick=world.sim_tick; this.notify('Gió sắp thổi'); }
    if(world.time_left_s<=10 && !this.warnedCountdown) {this.warnedCountdown=true;this.notify('10 giây cuối');}
    for(const l of world.lanterns) {
      if(l.lit && l.fuel_u<1800 && !this.warnedLanterns.has(l.id)) {this.warnedLanterns.add(l.id);this.notify(`Đèn ${l.id} sắp cạn dầu`);}
      else if(!l.lit || l.fuel_u>=1800) this.warnedLanterns.delete(l.id);
    }
    if(camera && now<this.arrowUntil) {
      this.marker.copy(this.target).project(camera);
      let x=this.marker.x, y=this.marker.y; if(this.marker.z>1){x=-x;y=-y;}
      const angle=Math.atan2(x,y); const radiusX=Math.max(20,innerWidth/2-36), radiusY=Math.max(20,innerHeight/2-36);
      const factor=1/Math.max(Math.abs(Math.sin(angle))/radiusX,Math.abs(Math.cos(angle))/radiusY);
      this.arrowEl.style.left=`${innerWidth/2+Math.sin(angle)*factor}px`; this.arrowEl.style.top=`${innerHeight/2-Math.cos(angle)*factor}px`;
      this.arrowEl.style.transform=`translate(-50%,-50%) rotate(${angle}rad)`; this.arrowEl.classList.remove('hidden');
    } else this.arrowEl.classList.add('hidden');
    this.flamesEl.textContent = '🔥'.repeat(Math.max(0, p.flames)) || 'Hết';
    this.nightEl.textContent = `Đêm ${world.night}`;

    // Đồng hồ mm:ss, đỏ & nhấp nháy khi <= 30s
    this.timeEl.textContent = formatTimeMMSS(world.time_left_s);
    if (world.time_left_s <= 30) {
      this.timeCardEl.classList.add('danger-blink');
    } else {
      this.timeCardEl.classList.remove('danger-blink');
    }

    let litCount = 0;
    for (let i=0;i<world.lanterns.length;i++) if(world.lanterns[i].lit) litCount++;
    const threshold = Math.ceil(world.tuning.win_ratio * world.lanterns.length);
    this.lanternsEl.textContent = `${litCount}/${threshold} đèn cần sáng`;
    this.scoreEl.textContent = String(world.score);
    this.motesEl.textContent = `${p.carried}/${Math.min(world.tuning.capacity_max, world.tuning.carry_capacity + 2 * p.successful_lights)}`;

    // Hồi chiêu Lướt (Shift)
    if (p.charm_ticks > 0) {
      this.dashEl.textContent = `BÙA GIÓ (${(p.charm_ticks / 60).toFixed(1)}s)`;
      this.dashEl.style.color = '#F2C14E';
    } else if (p.dash_cd_ticks > 0) {
      this.dashEl.textContent = `${(p.dash_cd_ticks / 60).toFixed(1)}s`;
      this.dashEl.style.color = 'var(--warning-color)';
    } else {
      this.dashEl.textContent = 'SẴN SÀNG';
      this.dashEl.style.color = '#FFE9B0';
    }

    // Hồi chiêu Tỏa Sáng (Q)
    if (p.pulse_cd_ticks > 0) {
      this.pulseEl.textContent = `${(p.pulse_cd_ticks / 60).toFixed(1)}s`;
      this.pulseEl.style.color = 'var(--warning-color)';
    } else if (p.carried < world.tuning.pulse_cost) {
      this.pulseEl.textContent = `Cần ${world.tuning.pulse_cost} ✨`;
      this.pulseEl.style.color = '#aaaaaa';
    } else {
      this.pulseEl.textContent = 'SẴN SÀNG';
      this.pulseEl.style.color = '#FFE9B0';
    }

    // Nhắc nạp đèn khi đứng trong bán kính tương tác của đèn chưa sáng
    const rSq = world.tuning.interact_radius * world.tuning.interact_radius;
    let nearUnlit = null;
    for (let i=0;i<world.lanterns.length;i++) {
      const l=world.lanterns[i];
      if (l.lit && l.fuel_u >= world.tuning.fuel_max * 60) continue;
      const dx=p.pos[0]-l.pos[0], dz=p.pos[2]-l.pos[2];
      if(dx*dx+dz*dz<=rSq) { nearUnlit=l; break; }
    }
    if (nearUnlit && world.state === 'playing') {
      this.promptEl.textContent = nearUnlit.lit ? `E — Châm dầu (${(nearUnlit.fuel_u / 60).toFixed(0)}%)` : `E — Nạp ánh sáng (${nearUnlit.deposited}/${nearUnlit.ever_lit ? world.tuning.relight_cost : world.tuning.lantern_cost})`;
      this.promptEl.classList.remove('hidden');
    } else {
      this.promptEl.classList.add('hidden');
    }
  }
}
