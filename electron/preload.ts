import { contextBridge, ipcRenderer } from 'electron';
contextBridge.exposeInMainWorld('desktop', {
  firstFrame: () => ipcRenderer.send('bench:first-frame'),
  onLoadTime: (callback:(ms:number)=>void) => ipcRenderer.on('bench:load-ms', (_event, ms:number) => callback(ms)),
  measureStart: () => ipcRenderer.send('bench:measure-start'),
  benchDone: (data:unknown) => ipcRenderer.send('bench:done', data),
  readLeaderboard: () => ipcRenderer.invoke('leaderboard:read'),
  addLeaderboard: (entry:unknown) => ipcRenderer.invoke('leaderboard:add', entry),
});
