export interface GameSettings { volume: number; sensitivity: number; colorblind: boolean }
const KEY = 'dao-den-long-settings';
const defaults: GameSettings = { volume: 0.7, sensitivity: 1, colorblind: false };

export function loadSettings(): GameSettings {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<GameSettings>;
    return {
      volume: typeof data.volume === 'number' && Number.isFinite(data.volume) ? Math.min(1, Math.max(0, data.volume)) : defaults.volume,
      sensitivity: typeof data.sensitivity === 'number' && Number.isFinite(data.sensitivity) ? Math.min(2, Math.max(0.25, data.sensitivity)) : defaults.sensitivity,
      colorblind: data.colorblind === true,
    };
  } catch { return { ...defaults }; }
}
export function saveSettings(settings: GameSettings): void {
  try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* Trình duyệt có thể chặn lưu. */ }
}
