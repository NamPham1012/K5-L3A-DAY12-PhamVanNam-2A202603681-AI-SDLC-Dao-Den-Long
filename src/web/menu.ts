export interface NightMeta {
  night: 1 | 2 | 3;
  title: string;
  islandName: string;
  quote: string;
}

export const NIGHT_METAS: Record<1 | 2 | 3, NightMeta> = {
  1: {
    night: 1,
    title: 'Đêm 1 · Đảo Bến',
    islandName: 'Đảo Bến',
    quote:
      'Ông Đăng: "Sương đen vừa tràn về bến cũ — con hãy giữ vững ngọn đèn mà thắp sáng năm trụ lớn."',
  },
  2: {
    night: 2,
    title: 'Đêm 2 · Đảo Cau',
    islandName: 'Đảo Cau',
    quote:
      'Ông Đăng: "Cầu tre nối hai bờ đảo rất hẹp — hãy nương bục nhảy, Bùa Gió và coi chừng Gió Lạc cướp ánh sáng."',
  },
  3: {
    night: 3,
    title: 'Đêm 3 · Đảo Chuông',
    islandName: 'Đảo Chuông',
    quote:
      'Ông Đăng: "Gió lớn sắp nổi quanh tháp chuông ba tầng — thắp đủ bảy ngọn đèn, bình minh sẽ trở lại."',
  },
};

export interface MenuCallbacks {
  onSelectNight: (night: 1 | 2 | 3) => void;
  onStartIntroNight: () => void;
  onResume: () => void;
  onRetryNight: () => void;
  onNextNight: () => void;
  onBackToMenu: () => void;
}

export class MenuOverlay {
  private root: HTMLDivElement;
  private mainMenuEl: HTMLElement;
  private introEl: HTMLElement;
  private introTitleEl: HTMLElement;
  private introQuoteEl: HTMLElement;
  private pauseEl: HTMLElement;
  private resultEl: HTMLElement;
  private resultBoxEl: HTMLElement;
  private resultTitleEl: HTMLElement;
  private resultDescEl: HTMLElement;
  private resultTotalEl: HTMLElement;
  private btnNextEl: HTMLButtonElement;
  private btnRetryEl: HTMLButtonElement;

  constructor(cb: MenuCallbacks) {
    this.root = document.createElement('div');
    this.root.id = 'ui-overlays';
    this.root.innerHTML = `
      <!-- Main Menu -->
      <div id="overlay-menu" class="modal-overlay">
        <div class="modal-box">
          <h1>ĐẢO ĐÈN LỒNG</h1>
          <p class="subtitle">Ba Hòn Đảo · Phase 2</p>
          <div class="btn-group">
            <button id="btn-night-1" class="ui-btn primary">Đêm 1 — Đảo Bến (5 đèn)</button>
            <button id="btn-night-2" class="ui-btn">Đêm 2 — Đảo Cau (6 đèn)</button>
            <button id="btn-night-3" class="ui-btn">Đêm 3 — Đảo Chuông (7 đèn)</button>
          </div>
          <div class="controls-hint">
            WASD: Đi · Chuột: Xoay · Space: Nhảy · Shift: Lướt · E: Nạp · Q: Tỏa Sáng · Esc/P: Tạm dừng
          </div>
        </div>
      </div>

      <!-- Night Intro -->
      <div id="overlay-intro" class="modal-overlay hidden">
        <div class="modal-box">
          <h1 id="intro-title">Đêm 1 · Đảo Bến</h1>
          <p id="intro-quote" class="quote-text"></p>
          <div class="btn-group">
            <button id="btn-intro-start" class="ui-btn primary">Bắt đầu Đêm</button>
            <button id="btn-intro-back" class="ui-btn secondary">Quay lại Menu</button>
          </div>
        </div>
      </div>

      <!-- Pause Menu -->
      <div id="overlay-pause" class="modal-overlay hidden">
        <div class="modal-box">
          <h1>TẠM DỪNG</h1>
          <p>Nhấn Esc hoặc P để tiếp tục</p>
          <div class="btn-group">
            <button id="btn-pause-resume" class="ui-btn primary">Tiếp tục</button>
            <button id="btn-pause-retry" class="ui-btn">Chơi lại Đêm</button>
            <button id="btn-pause-menu" class="ui-btn secondary">Về menu</button>
          </div>
        </div>
      </div>

      <!-- Result / Dawn Screen -->
      <div id="overlay-result" class="modal-overlay hidden">
        <div id="result-box" class="modal-box">
          <h1 id="result-title">KẾT THÚC</h1>
          <p id="result-desc"></p>
          <p id="result-total" class="total-score"></p>
          <div class="btn-group">
            <button id="btn-result-next" class="ui-btn primary hidden">Sang Đêm kế tiếp</button>
            <button id="btn-result-retry" class="ui-btn primary">Chơi lại Đêm này</button>
            <button id="btn-result-menu" class="ui-btn secondary">Về menu</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(this.root);

    this.mainMenuEl = document.getElementById('overlay-menu')!;
    this.introEl = document.getElementById('overlay-intro')!;
    this.introTitleEl = document.getElementById('intro-title')!;
    this.introQuoteEl = document.getElementById('intro-quote')!;
    this.pauseEl = document.getElementById('overlay-pause')!;
    this.resultEl = document.getElementById('overlay-result')!;
    this.resultBoxEl = document.getElementById('result-box')!;
    this.resultTitleEl = document.getElementById('result-title')!;
    this.resultDescEl = document.getElementById('result-desc')!;
    this.resultTotalEl = document.getElementById('result-total')!;
    this.btnNextEl = document.getElementById('btn-result-next') as HTMLButtonElement;
    this.btnRetryEl = document.getElementById('btn-result-retry') as HTMLButtonElement;

    document.getElementById('btn-night-1')!.addEventListener('click', () => cb.onSelectNight(1));
    document.getElementById('btn-night-2')!.addEventListener('click', () => cb.onSelectNight(2));
    document.getElementById('btn-night-3')!.addEventListener('click', () => cb.onSelectNight(3));
    document.getElementById('btn-intro-start')!.addEventListener('click', () => cb.onStartIntroNight());
    document.getElementById('btn-intro-back')!.addEventListener('click', () => cb.onBackToMenu());
    document.getElementById('btn-pause-resume')!.addEventListener('click', () => cb.onResume());
    document.getElementById('btn-pause-retry')!.addEventListener('click', () => cb.onRetryNight());
    document.getElementById('btn-pause-menu')!.addEventListener('click', () => cb.onBackToMenu());
    this.btnNextEl.addEventListener('click', () => cb.onNextNight());
    this.btnRetryEl.addEventListener('click', () => cb.onRetryNight());
    document.getElementById('btn-result-menu')!.addEventListener('click', () => cb.onBackToMenu());
  }

  public hideAll(): void {
    this.mainMenuEl.classList.add('hidden');
    this.introEl.classList.add('hidden');
    this.pauseEl.classList.add('hidden');
    this.resultEl.classList.add('hidden');
  }

  public showMainMenu(): void {
    this.hideAll();
    this.mainMenuEl.classList.remove('hidden');
  }

  public showIntro(night: 1 | 2 | 3): void {
    this.hideAll();
    const meta = NIGHT_METAS[night];
    this.introTitleEl.textContent = meta.title;
    this.introQuoteEl.textContent = meta.quote;
    this.introEl.classList.remove('hidden');
  }

  public showPause(): void {
    this.hideAll();
    this.pauseEl.classList.remove('hidden');
  }

  public showResult(opts: {
    night: 1 | 2 | 3;
    won: boolean;
    nightScore: number;
    totalScore: number;
    lossReason?: string;
  }): void {
    this.hideAll();
    this.resultBoxEl.classList.remove('dawn-theme');

    if (opts.won && opts.night === 3) {
      // Thắng Đêm 3 -> Màn hình Bình Minh + tổng điểm
      this.resultBoxEl.classList.add('dawn-theme');
      this.resultTitleEl.textContent = 'BÌNH MINH TRỞ LẠI!';
      this.resultTitleEl.style.color = '#FFE9B0';
      this.resultDescEl.textContent = `Bạn đã thắp sáng cả ba hòn đảo! Điểm Đêm 3: ${opts.nightScore}`;
      this.resultTotalEl.textContent = `Tổng điểm hành trình: ${opts.totalScore}`;
      this.btnNextEl.classList.add('hidden');
      this.btnRetryEl.textContent = 'Chơi lại Đêm 3';
      this.btnRetryEl.classList.remove('hidden');
    } else if (opts.won) {
      this.resultTitleEl.textContent = `THẮNG ĐÊM ${opts.night}!`;
      this.resultTitleEl.style.color = '#F2C14E';
      this.resultDescEl.textContent = `Điểm Đêm ${opts.night}: ${opts.nightScore}`;
      this.resultTotalEl.textContent = `Tổng điểm tích lũy: ${opts.totalScore}`;
      this.btnNextEl.textContent = `Sang Đêm ${opts.night + 1}`;
      this.btnNextEl.classList.remove('hidden');
      this.btnRetryEl.classList.add('hidden');
    } else {
      this.resultTitleEl.textContent = `THẤT BẠI — ĐÊM ${opts.night}`;
      this.resultTitleEl.style.color = '#FF5A5F';
      this.resultDescEl.textContent = `Lý do: ${opts.lossReason ?? 'Hết Ngọn Lửa'}. Điểm: ${opts.nightScore}`;
      this.resultTotalEl.textContent = `Tổng điểm tích lũy: ${opts.totalScore}`;
      this.btnNextEl.classList.add('hidden');
      this.btnRetryEl.textContent = `Chơi lại Đêm ${opts.night}`;
      this.btnRetryEl.classList.remove('hidden');
    }

    this.resultEl.classList.remove('hidden');
  }
}
