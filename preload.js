const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  takeScreenshot: () => ipcRenderer.invoke('take-screenshot'),
  onCheckBalance: (callback) => ipcRenderer.on('check-balance', () => callback()),
  // ADD THIS LINE:
  onMenuToggleSettings: (callback) => ipcRenderer.on('menu-toggle-settings', () => callback())
});