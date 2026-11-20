import { World } from '../core/world.js';

export class HudOverlay {
  private container: HTMLDivElement;
  private flamesEl: HTMLElement;
  private motesEl: HTMLElement;
  private lanternsEl: HTMLElement;
  private timeEl: HTMLElement;
  private scoreEl: HTMLElement;
  private pulseEl: HTMLElement;
  private modalEl: HTMLElement;
  private modalTitleEl: HTMLElement;
  private modalDescEl: HTMLElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'hud';
    this.container.innerHTML = `
      <div class="hud-top">
        <div class="hud-card">🔥 Lửa: <span id="hud-flames">3</span></div>
        <div class="hud-card">✨ Đom đóm: <span id="hud-motes">0/10</span></div>
        <div class="hud-card">🏮 Đèn: <span id="hud-lanterns">0/5</span></div>
        <div class="hud-card">⏳ Thời gian: <span id="hud-time">300</span>s</div>
        <div class="hud-card">🏆 Điểm: <span id="hud-score">0</span></div>
        <div class="hud-card">⚡ Tỏa sáng (Q): <span id="hud-pulse">Sẵn sàng</span></div>
      </div>
      <div id="game-modal" class="modal-overlay hidden">
        <div class="modal-box">
          <h1 id="modal-title">KẾT THÚC</h1>
          <p id="modal-desc">Mô tả kết quả</p>
          <div class="modal-hint">Nhấn phím <b>R</b> để chơi lại màn mới</div>
        </div>
      </div>
    `;
    document.body.appendChild(this.container);

    this.flamesEl = document.getElementById('hud-flames')!;
    this.motesEl = document.getElementById('hud-motes')!;
    this.lanternsEl = document.getElementById('hud-lanterns')!;
    this.timeEl = document.getElementById('hud-time')!;
    this.scoreEl = document.getElementById('hud-score')!;
    this.pulseEl = document.getElementById('hud-pulse')!;
    this.modalEl = document.getElementById('game-modal')!;
    this.modalTitleEl = document.getElementById('modal-title')!;
    this.modalDescEl = document.getElementById('modal-desc')!;
  }

  public update(world: World): void {
    this.flamesEl.textContent = '🔥'.repeat(Math.max(0, world.player.flames)) || 'Hết';
    this.motesEl.textContent = `${world.player.carried}/${world.tuning.carry_capacity}`;
    const litCount = world.lanterns.filter((l) => l.lit).length;
    this.lanternsEl.textContent = `${litCount}/5`;
    this.timeEl.textContent = Math.max(0, Math.ceil(world.time_left_s)).toString();
    this.scoreEl.textContent = world.score.toString();

    if (world.player.pulse_cooldown_timer > 0) {
      this.pulseEl.textContent = `${world.player.pulse_cooldown_timer.toFixed(1)}s`;
      this.pulseEl.style.color = '#ff6666';
    } else if (world.player.carried < world.tuning.pulse_cost) {
      this.pulseEl.textContent = `Cần ${world.tuning.pulse_cost} ✨`;
      this.pulseEl.style.color = '#aaaaaa';
    } else {
      this.pulseEl.textContent = 'SẴN SÀNG';
      this.pulseEl.style.color = '#ffff66';
    }

    if (world.state === 'won') {
      this.modalEl.classList.remove('hidden');
      this.modalTitleEl.textContent = 'CHIẾN THẮNG!';
      this.modalTitleEl.style.color = '#ffcc00';
      this.modalDescEl.textContent = `Bạn đã thắp sáng toàn bộ đảo! Điểm số: ${world.score}`;
    } else if (world.state === 'lost') {
      this.modalEl.classList.remove('hidden');
      this.modalTitleEl.textContent = 'THẤT BẠI!';
      this.modalTitleEl.style.color = '#ff4444';
      const reason = world.player.flames <= 0 ? 'Mất hết ngọn lửa' : 'Hết thời gian (Bình minh đến)';
      this.modalDescEl.textContent = `Lý do: ${reason}. Điểm số: ${world.score}`;
    } else {
      this.modalEl.classList.add('hidden');
    }
  }
}
