const {contextBridge, ipcRenderer} = require('electron');
const bridge = {};
for (const method of ['openProjectPage','inspectYouTube','startYouTube','waitYouTube','cancelYouTube','releaseYouTube','saveAudio','resolveAudio','removeAudio']) {
  bridge[method] = async (...args) => {
    const response = await ipcRenderer.invoke(`studio:${method}`, ...args);
    if (!response.ok) throw new Error(response.message);
    return response.value;
  };
}
bridge.onYouTubeProgress = listener => {
  const handler = (_event, value) => listener(value);
  ipcRenderer.on('studio:progress', handler);
  return () => ipcRenderer.removeListener('studio:progress', handler);
};
contextBridge.exposeInMainWorld('listeningLab', bridge);
