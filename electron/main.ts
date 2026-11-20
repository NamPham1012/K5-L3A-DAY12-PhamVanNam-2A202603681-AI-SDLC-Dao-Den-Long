import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { topEntries, LeaderboardEntry } from '../src/core/leaderboard.js';

const processStart = Date.now() - process.uptime() * 1000;
app.commandLine.appendSwitch('disable-gpu-vsync');
app.commandLine.appendSwitch('disable-frame-rate-limit');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
const args = process.argv.slice(2);
const value = (key:string) => { const idx = args.indexOf(key); return idx < 0 ? undefined : args[idx + 1]; };
const leaderboardFile = () => path.join(app.getPath('userData'), 'leaderboard.json');
function readEntries(): LeaderboardEntry[] {
  const file = leaderboardFile();
  if (!fs.existsSync(file)) return [];
  const data: unknown = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!data || typeof data !== 'object' || !Array.isArray((data as {entries?:unknown}).entries)) throw new Error('Invalid leaderboard file');
  return topEntries((data as {entries:LeaderboardEntry[]}).entries);
}
function addEntry(entry:LeaderboardEntry):LeaderboardEntry[] {
  const entries=topEntries([...readEntries(),entry]);
  fs.mkdirSync(path.dirname(leaderboardFile()), {recursive:true});
  fs.writeFileSync(leaderboardFile(),JSON.stringify({entries},null,2)+'\n');
  return entries;
}
let win: BrowserWindow | null = null;
let benchComplete = false;
let peakMemory = 0;
let timer: NodeJS.Timeout | undefined;
function sampleRss(): void {
  const totalKb = app.getAppMetrics().reduce((sum, process) => sum + (process.memory?.workingSetSize ?? 0), 0);
  peakMemory = Math.max(peakMemory, totalKb / 1024);
}
app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);
  const exportPath = value('--export-leaderboard');
  if (args.includes('--export-leaderboard')) {
    if (!exportPath) throw new Error('Missing leaderboard output path');
    fs.writeFileSync(exportPath, JSON.stringify({entries:readEntries()}, null, 2) + '\n');
    app.exit(0); return;
  }
  if (args.includes('--add-leaderboard-entry')) {
    const input=value('--add-leaderboard-entry');
    if (!input) throw new Error('Missing leaderboard entry');
    addEntry(JSON.parse(input) as LeaderboardEntry); app.exit(0); return;
  }
  if (args.includes('--add-leaderboard-entry-file')) {
    const input=value('--add-leaderboard-entry-file');
    if (!input) throw new Error('Missing leaderboard entry file');
    addEntry(JSON.parse(fs.readFileSync(input, 'utf8')) as LeaderboardEntry); app.exit(0); return;
  }
  const bench = args.includes('--bench');
  const seed = Number(value('--seed') ?? 42), duration = Number(value('--duration') ?? 30), out = value('--out');
  if (bench && (!Number.isInteger(seed) || !Number.isFinite(duration) || duration <= 0 || !out)) throw new Error('Invalid benchmark arguments');
  ipcMain.handle('leaderboard:read', () => readEntries());
  ipcMain.handle('leaderboard:add', (_event, entry:LeaderboardEntry) => {
    return addEntry(entry);
  });
  ipcMain.on('bench:first-frame', (event) => { console.log('Benchmark: first frame'); event.sender.send('bench:load-ms', Date.now() - processStart); });
  ipcMain.on('bench:measure-start', () => { console.log('Benchmark: measurement started'); sampleRss(); timer = setInterval(sampleRss, 500); });
  ipcMain.on('bench:done', (_event, data) => {
    try {
      sampleRss(); if (timer) clearInterval(timer);
      fs.mkdirSync(path.dirname(path.resolve(out!)), {recursive:true});
      const {slowest_frames, ...metrics} = data;
      fs.writeFileSync(path.join(path.dirname(path.resolve(out!)), 'bench-frames.json'), JSON.stringify({slowest_frames}, null, 2) + '\n');
      fs.writeFileSync(out!, JSON.stringify({contract_version:'1.3', ...metrics, peak_mem_mb:peakMemory || null, vsync_off:true, os:`${os.platform()} ${os.release()} ${os.arch()}`}, null, 2) + '\n');
      benchComplete = true;
      console.log(`Benchmark saved: ${out}`);
      app.exit(0);
    } catch (error) { console.error(error); app.exit(1); }
  });
  win = new BrowserWindow({width:1280, height:720, useContentSize:true, resizable:false, fullscreen:false, show:true,
    webPreferences:{preload:path.join(__dirname, 'preload.cjs'), contextIsolation:true, nodeIntegration:false, backgroundThrottling:false} });
  win.webContents.on('did-fail-load', (_event, code, description) => { console.error(`Renderer load failed: ${code} ${description}`); if (bench) app.exit(1); });
  win.webContents.on('render-process-gone', (_event, details) => { console.error(`Renderer exited: ${details.reason}`); if (bench) app.exit(1); });
  win.webContents.on('console-message', (_event, level, message) => { if (level >= 2) console.error(`Renderer: ${message}`); });
  if (bench) win.once('closed', () => { if (!benchComplete) { console.error('Benchmark window closed before results were written'); app.exit(1); } });
  win.on('closed', () => { win = null; });
  await win.loadFile(path.join(__dirname, 'web', 'index.html'), {query:bench ? {bench:'1',seed:String(seed),duration:String(duration)} : {}});
}).catch(error => { console.error(error); app.exit(1); });
app.on('window-all-closed', () => app.quit());
