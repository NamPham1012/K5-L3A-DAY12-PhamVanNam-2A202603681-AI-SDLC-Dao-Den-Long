export const DEFAULT_KEYS = { forward:'KeyW', back:'KeyS', left:'KeyA', right:'KeyD', jump:'Space', dash:'ShiftLeft', interact:'KeyE', pulse:'KeyQ', pause:'Escape', hint:'KeyH' } as const;
export type Action = keyof typeof DEFAULT_KEYS;
export type KeyBindings = Record<Action, string>;
export const ACTION_LABELS: Record<Action,string> = {forward:'Tiến',back:'Lùi',left:'Trái',right:'Phải',jump:'Nhảy',dash:'Lướt',interact:'Tương tác',pulse:'Tỏa sáng',pause:'Tạm dừng',hint:'Gợi ý'};
export interface GameSettings { volume: number; sensitivity: number; colorblind: boolean; reducedMotion:boolean; largeText:boolean; keys:KeyBindings }
const KEY = 'dao-den-long-settings';
const defaults: GameSettings = { volume: 0.7, sensitivity: 1, colorblind: false, reducedMotion:false, largeText:false, keys:{...DEFAULT_KEYS} };

export function loadSettings(): GameSettings {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<GameSettings>;
    const keys = { ...DEFAULT_KEYS, ...data.keys } as KeyBindings;
    const validKeys = Object.keys(DEFAULT_KEYS).every(key => typeof keys[key as Action] === 'string' && keys[key as Action].length > 0) && new Set(Object.values(keys)).size === Object.keys(DEFAULT_KEYS).length;
    return {
      volume: typeof data.volume === 'number' && Number.isFinite(data.volume) ? Math.min(1, Math.max(0, data.volume)) : defaults.volume,
      sensitivity: typeof data.sensitivity === 'number' && Number.isFinite(data.sensitivity) ? Math.min(2, Math.max(0.25, data.sensitivity)) : defaults.sensitivity,
      colorblind: data.colorblind === true,
      reducedMotion: data.reducedMotion === true,
      largeText: data.largeText === true,
      keys: validKeys ? keys : {...DEFAULT_KEYS},
    };
  } catch { return { ...defaults }; }
}
export function saveSettings(settings: GameSettings): void {
  try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* Trình duyệt có thể chặn lưu. */ }
}
