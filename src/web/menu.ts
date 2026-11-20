import { ACTION_LABELS, Action, DEFAULT_KEYS, GameSettings } from './settings.js';
import { addLeaderboard, readLeaderboard } from './leaderboard.js';
import { validateEntry } from '../core/leaderboard.js';

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
  onSettingsChange: (settings: GameSettings) => void;
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
  private settingsEl: HTMLElement;
  private leaderboardEl: HTMLElement;
  private settingsReturn: 'menu' | 'pause' = 'menu';

  constructor(cb: MenuCallbacks, settings: GameSettings) {
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
            <button id="btn-menu-settings" class="ui-btn">Cài đặt</button>
            <button id="btn-leaderboard" class="ui-btn">Bảng xếp hạng</button>
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
            <button id="btn-pause-settings" class="ui-btn">Cài đặt</button>
            <button id="btn-pause-menu" class="ui-btn secondary">Về menu</button>
          </div>
        </div>
      </div>

      <div id="overlay-settings" class="modal-overlay hidden">
        <div class="modal-box settings-box" role="dialog" aria-modal="true" aria-labelledby="settings-title">
          <h1 id="settings-title">Cài đặt</h1>
          <label for="settings-volume">Âm lượng <output id="settings-volume-value"></output></label>
          <input id="settings-volume" type="range" min="0" max="1" step="0.05">
          <label for="settings-sensitivity">Độ nhạy chuột <output id="settings-sensitivity-value"></output></label>
          <input id="settings-sensitivity" type="range" min="0.25" max="2" step="0.05">
          <label class="settings-checkbox"><input id="settings-colorblind" type="checkbox"> Bảng màu dễ phân biệt</label>
          <label class="settings-checkbox"><input id="settings-reduced" type="checkbox"> Giảm chuyển động</label>
          <label class="settings-checkbox"><input id="settings-large" type="checkbox"> Chữ lớn ×1.25</label>
          <h2>Điều khiển</h2><p id="key-error" role="alert"></p><div id="key-bindings" class="key-bindings"></div>
          <button id="btn-reset-keys" class="ui-btn">Khôi phục mặc định</button>
          <button id="btn-settings-back" class="ui-btn primary">Quay lại</button>
        </div>
      </div>

      <div id="overlay-leaderboard" class="modal-overlay hidden"><div class="modal-box leaderboard-box">
        <h1>Bảng xếp hạng</h1><div class="table-scroll"><table><thead><tr><th>Tên</th><th>Điểm</th><th>Đêm thắng</th><th>Thời điểm</th></tr></thead><tbody id="leaderboard-rows"></tbody></table></div>
        <p id="leaderboard-empty" class="hidden">Chưa có điểm nào.</p><button id="btn-leaderboard-back" class="ui-btn primary">Quay lại</button>
      </div></div>

      <!-- Result / Dawn Screen -->
      <div id="overlay-result" class="modal-overlay hidden">
        <div id="result-box" class="modal-box">
          <h1 id="result-title">KẾT THÚC</h1>
          <p id="result-desc"></p>
          <p id="result-total" class="total-score"></p>
          <form id="score-form" class="hidden"><label for="score-name">Tên của bạn (3–12 ký tự)</label><input id="score-name" maxlength="12" autocomplete="nickname"><button class="ui-btn" type="submit">Lưu điểm</button><p id="score-error" role="alert"></p></form>
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
    this.settingsEl = document.getElementById('overlay-settings')!;
    this.leaderboardEl = document.getElementById('overlay-leaderboard')!;
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
    const volume = document.getElementById('settings-volume') as HTMLInputElement;
    const sensitivity = document.getElementById('settings-sensitivity') as HTMLInputElement;
    const colorblind = document.getElementById('settings-colorblind') as HTMLInputElement;
    const reduced = document.getElementById('settings-reduced') as HTMLInputElement;
    const large = document.getElementById('settings-large') as HTMLInputElement;
    let bindings = {...settings.keys};
    volume.value = String(settings.volume); sensitivity.value = String(settings.sensitivity); colorblind.checked = settings.colorblind; reduced.checked=settings.reducedMotion; large.checked=settings.largeText;
    const updateSettings = () => {
      const next = { volume: Number(volume.value), sensitivity: Number(sensitivity.value), colorblind: colorblind.checked, reducedMotion:reduced.checked, largeText:large.checked, keys:{...bindings} };
      document.getElementById('settings-volume-value')!.textContent = `${Math.round(next.volume * 100)}%`;
      document.getElementById('settings-sensitivity-value')!.textContent = `${next.sensitivity.toFixed(2)}×`;
      cb.onSettingsChange(next);
    };
    volume.addEventListener('input', updateSettings); sensitivity.addEventListener('input', updateSettings); colorblind.addEventListener('change', updateSettings);
    reduced.addEventListener('change',updateSettings); large.addEventListener('change',updateSettings);
    const bindingsEl=document.getElementById('key-bindings')!; const keyError=document.getElementById('key-error')!;
    let listening:Action|null=null;
    const renderKeys=()=>{ bindingsEl.replaceChildren(); for(const action of Object.keys(DEFAULT_KEYS) as Action[]) {const button=document.createElement('button');button.type='button';button.className='ui-btn key-binding';button.textContent=`${ACTION_LABELS[action]}: ${listening===action?'Nhấn phím…':bindings[action]}`;button.addEventListener('click',()=>{listening=action;keyError.textContent='';renderKeys();});bindingsEl.appendChild(button);} };
    window.addEventListener('keydown',(e)=>{if(!listening || this.settingsEl.classList.contains('hidden'))return;e.preventDefault();e.stopImmediatePropagation();const duplicate=(Object.keys(bindings) as Action[]).find(a=>a!==listening && bindings[a]===e.code);if(duplicate){keyError.textContent=`Phím ${e.code} đã dùng cho ${ACTION_LABELS[duplicate]}.`;return;}bindings[listening]=e.code;listening=null;keyError.textContent='';renderKeys();updateSettings();},true);
    document.getElementById('btn-reset-keys')!.addEventListener('click',()=>{bindings={...DEFAULT_KEYS};listening=null;keyError.textContent='';renderKeys();updateSettings();});
    renderKeys();
    updateSettings();
    document.getElementById('btn-menu-settings')!.addEventListener('click', () => this.showSettings('menu'));
    document.getElementById('btn-pause-settings')!.addEventListener('click', () => this.showSettings('pause'));
    document.getElementById('btn-settings-back')!.addEventListener('click', () => this.settingsReturn === 'menu' ? this.showMainMenu() : this.showPause());
    document.getElementById('btn-leaderboard')!.addEventListener('click',()=>{void this.showLeaderboard();});
    document.getElementById('btn-leaderboard-back')!.addEventListener('click',()=>this.showMainMenu());
    this.btnNextEl.addEventListener('click', () => cb.onNextNight());
    this.btnRetryEl.addEventListener('click', () => cb.onRetryNight());
    document.getElementById('btn-result-menu')!.addEventListener('click', () => cb.onBackToMenu());
  }

  public hideAll(): void {
    this.mainMenuEl.classList.add('hidden');
    this.introEl.classList.add('hidden');
    this.pauseEl.classList.add('hidden');
    this.resultEl.classList.add('hidden');
    this.settingsEl.classList.add('hidden');
    this.leaderboardEl.classList.add('hidden');
  }

  private async showLeaderboard():Promise<void> {
    this.hideAll();this.leaderboardEl.classList.remove('hidden');
    const body=document.getElementById('leaderboard-rows')!; body.replaceChildren();
    try { const entries=await readLeaderboard(); document.getElementById('leaderboard-empty')!.classList.toggle('hidden',entries.length!==0);
      for(const entry of entries){const row=document.createElement('tr');for(const value of [entry.name,String(entry.score),String(entry.nights_won),entry.achieved_at]){const cell=document.createElement('td');cell.textContent=value;row.appendChild(cell);}body.appendChild(row);}
    } catch { document.getElementById('leaderboard-empty')!.textContent='Không đọc được bảng xếp hạng.';document.getElementById('leaderboard-empty')!.classList.remove('hidden'); }
  }

  private showSettings(from: 'menu' | 'pause'): void {
    this.settingsReturn = from;
    this.hideAll();
    this.settingsEl.classList.remove('hidden');
    (document.getElementById('settings-volume') as HTMLInputElement).focus();
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
    nightsWon: number;
    seed: number;
    lossReason?: string;
  }): void {
    this.hideAll();
    this.resultBoxEl.classList.remove('dawn-theme');
    const form=document.getElementById('score-form') as HTMLFormElement;
    const name=document.getElementById('score-name') as HTMLInputElement;
    const error=document.getElementById('score-error')!;
    const shouldSave=!opts.won || opts.night===3;
    form.classList.toggle('hidden',!shouldSave);name.value='';error.textContent='';
    form.onsubmit=(e)=>{e.preventDefault(); const entry={name:name.value.trim().normalize('NFC'),score:opts.totalScore,nights_won:opts.nightsWon,achieved_at:new Date().toISOString(),seed:opts.seed}; if(!validateEntry(entry)){error.textContent='Tên cần 3–12 chữ, số hoặc dấu gạch dưới.';return;} void addLeaderboard(entry).then(()=>{form.classList.add('hidden');error.textContent='';}).catch(()=>{error.textContent='Không thể lưu điểm. Hãy thử lại.';});};

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
      this.resultTitleEl.style.color = 'var(--warning-color)';
      this.resultDescEl.textContent = `Lý do: ${opts.lossReason ?? 'Hết Ngọn Lửa'}. Điểm: ${opts.nightScore}`;
      this.resultTotalEl.textContent = `Tổng điểm tích lũy: ${opts.totalScore}`;
      this.btnNextEl.classList.add('hidden');
      this.btnRetryEl.textContent = `Chơi lại Đêm ${opts.night}`;
      this.btnRetryEl.classList.remove('hidden');
    }

    this.resultEl.classList.remove('hidden');
  }
}
