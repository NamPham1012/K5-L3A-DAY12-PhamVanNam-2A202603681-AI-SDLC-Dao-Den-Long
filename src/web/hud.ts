import { World } from '../core/world.js';

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
  }

  public setVisible(visible: boolean): void {
    if (visible) {
      this.container.classList.remove('hidden');
    } else {
      this.container.classList.add('hidden');
    }
  }

  public update(world: World): void {
    const p = world.player;
    this.flamesEl.textContent = '🔥'.repeat(Math.max(0, p.flames)) || 'Hết';
    this.nightEl.textContent = `Đêm ${world.night}`;

    // Đồng hồ mm:ss, đỏ & nhấp nháy khi <= 30s
    this.timeEl.textContent = formatTimeMMSS(world.time_left_s);
    if (world.time_left_s <= 30) {
      this.timeCardEl.classList.add('danger-blink');
    } else {
      this.timeCardEl.classList.remove('danger-blink');
    }

    const litCount = world.lanterns.filter((l) => l.lit).length;
    this.lanternsEl.textContent = `${litCount}/${world.lanterns.length}`;
    this.scoreEl.textContent = String(world.score);
    this.motesEl.textContent = `${p.carried}/${world.tuning.carry_capacity}`;

    // Hồi chiêu Lướt (Shift)
    if (p.charm_ticks > 0) {
      this.dashEl.textContent = `BÙA GIÓ (${(p.charm_ticks / 60).toFixed(1)}s)`;
      this.dashEl.style.color = '#F2C14E';
    } else if (p.dash_cd_ticks > 0) {
      this.dashEl.textContent = `${(p.dash_cd_ticks / 60).toFixed(1)}s`;
      this.dashEl.style.color = '#FF5A5F';
    } else {
      this.dashEl.textContent = 'SẴN SÀNG';
      this.dashEl.style.color = '#FFE9B0';
    }

    // Hồi chiêu Tỏa Sáng (Q)
    if (p.pulse_cd_ticks > 0) {
      this.pulseEl.textContent = `${(p.pulse_cd_ticks / 60).toFixed(1)}s`;
      this.pulseEl.style.color = '#FF5A5F';
    } else if (p.carried < world.tuning.pulse_cost) {
      this.pulseEl.textContent = `Cần ${world.tuning.pulse_cost} ✨`;
      this.pulseEl.style.color = '#aaaaaa';
    } else {
      this.pulseEl.textContent = 'SẴN SÀNG';
      this.pulseEl.style.color = '#FFE9B0';
    }

    // Nhắc nạp đèn khi đứng trong bán kính tương tác của đèn chưa sáng
    const rSq = world.tuning.interact_radius * world.tuning.interact_radius;
    const nearUnlit = world.lanterns.find((l) => {
      if (l.lit) return false;
      const dx = p.pos[0] - l.pos[0];
      const dz = p.pos[2] - l.pos[2];
      return dx * dx + dz * dz <= rSq;
    });
    if (nearUnlit && world.state === 'playing') {
      this.promptEl.textContent = `E — Nạp ánh sáng (${nearUnlit.deposited}/${world.tuning.lantern_cost})`;
      this.promptEl.classList.remove('hidden');
    } else {
      this.promptEl.classList.add('hidden');
    }
  }
}
