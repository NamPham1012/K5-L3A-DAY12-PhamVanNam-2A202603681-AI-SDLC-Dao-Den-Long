import { LeaderboardEntry, topEntries } from '../core/leaderboard.js';
const KEY='dao-den-long-leaderboard';
export async function readLeaderboard():Promise<LeaderboardEntry[]> {
  if(window.desktop) return window.desktop.readLeaderboard();
  try { const value=JSON.parse(localStorage.getItem(KEY) ?? '[]'); return topEntries(value); } catch { return []; }
}
export async function addLeaderboard(entry:LeaderboardEntry):Promise<LeaderboardEntry[]> {
  if(window.desktop) return window.desktop.addLeaderboard(entry);
  const entries=topEntries([...(await readLeaderboard()),entry]);
  localStorage.setItem(KEY,JSON.stringify(entries)); return entries;
}
