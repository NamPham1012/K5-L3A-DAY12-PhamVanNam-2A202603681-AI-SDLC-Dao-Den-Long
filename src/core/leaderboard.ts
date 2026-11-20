export interface LeaderboardEntry { name:string; score:number; nights_won:number; achieved_at:string; seed:number }
function instant(value: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!m) return NaN;
  const [year, month, day, hour, minute, second] = m.slice(1,7).map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31,leap ? 29 : 28,31,30,31,30,31,31,30,31,30,31];
  if (month < 1 || month > 12 || day < 1 || day > days[month-1] || hour > 23 || minute > 59 || second > 59) return NaN;
  const y = year - 1;
  const dayNumber = 365*y + Math.floor(y/4) - Math.floor(y/100) + Math.floor(y/400) + days.slice(0,month-1).reduce((a,b)=>a+b,0) + day - 1;
  const zone = m[8] === 'Z' ? 0 : (m[8][0] === '+' ? 1 : -1) * (Number(m[8].slice(1,3))*60 + Number(m[8].slice(4,6)));
  if (m[8] !== 'Z' && (Number(m[8].slice(1,3)) > 23 || Number(m[8].slice(4,6)) > 59)) return NaN;
  return (((dayNumber*24 + hour)*60 + minute-zone)*60+second)*1000 + Number((m[7] ?? '').padEnd(3,'0') || 0);
}
export function validateEntry(entry: LeaderboardEntry): boolean {
  return /^[\p{L}0-9_]{3,12}$/u.test(entry.name) && Number.isInteger(entry.score) && entry.score >= 0 && Number.isInteger(entry.nights_won) && entry.nights_won >= 0 && entry.nights_won <= 3 && Number.isInteger(entry.seed) && Number.isFinite(instant(entry.achieved_at));
}
export function topEntries(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  if (!entries.every(validateEntry)) throw new Error('Invalid leaderboard entry');
  return [...entries].sort((a,b) => b.score-a.score || instant(a.achieved_at)-instant(b.achieved_at)).slice(0,10);
}
