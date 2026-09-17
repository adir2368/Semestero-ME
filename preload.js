const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    isElectron: true,
    fetchMoodleFeed: (url) => ipcRenderer.invoke('fetch-moodle-feed', url)
});
