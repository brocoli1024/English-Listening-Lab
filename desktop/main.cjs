const {app,BrowserWindow,protocol,ipcMain,session,dialog} = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');
const {registerDesktopProtocol} = require('./protocol.cjs');
const {createAudioStore} = require('./audio-store.cjs');
const {createJobManager} = require('./jobs.cjs');
const {registerIpc} = require('./ipc.cjs');
const {openProjectPage} = require('./project-links.cjs');
protocol.registerSchemesAsPrivileged([{scheme:'app',privileges:{standard:true,secure:true,supportFetchAPI:true,stream:true}}]);
app.setName('English Listening Lab');
const testData = process.env.LISTENING_LAB_TEST_DATA_DIR;
if (testData) {
  if (!path.isAbsolute(testData)) throw new Error('Test data directory must be absolute');
  app.setPath('userData',testData);
} else app.setPath('userData',path.join(app.getPath('appData'),'English Listening Lab'));
let jobs, quitting=false;
if (!app.requestSingleInstanceLock()) app.quit();
else app.whenReady().then(async()=>{
  const tempRoot=path.join(app.getPath('userData'),'import-jobs');
  // This fixed child directory contains only disposable download jobs.
  await fs.rm(tempRoot,{recursive:true,force:true});
  await fs.mkdir(tempRoot,{recursive:true});
  const toolsRoot = app.isPackaged ? path.join(process.resourcesPath,'tools') : path.join(__dirname,'vendor');
  const tools = require('./tools.cjs').resolveTools(toolsRoot, false);
  const window = new BrowserWindow({width:1180,height:840,minWidth:600,minHeight:580,show:false,backgroundColor:'#F3F0E7',webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,sandbox:true,nodeIntegration:false,webSecurity:true}});
  window.setMenuBarVisibility(false);
  window.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  window.webContents.on('will-navigate',(event,url)=>{if(url!=='app://studio/' && url!=='app://studio/index.html') event.preventDefault();});
  window.webContents.on('will-attach-webview',event=>event.preventDefault());
  session.defaultSession.setPermissionRequestHandler((_contents,_permission,callback)=>callback(false));
  session.defaultSession.setPermissionCheckHandler(()=>false);
  jobs=createJobManager({tools,tempRoot,onProgress:(owner,event)=>{if(!window.isDestroyed() && window.webContents.id===owner) window.webContents.send('studio:progress',event);}});
  const audioStore=createAudioStore(path.join(app.getPath('userData'),'audio'),(token,owner)=>jobs.source(token,owner));
  registerDesktopProtocol({staticRoot:path.join(__dirname,'..','dist'),audioStore});
  registerIpc({ipcMain,window,jobs,audioStore,openProjectPage});
  window.once('ready-to-show',()=>window.show());
  await window.loadURL('app://studio/');
  app.on('second-instance',()=>{if(window.isMinimized()) window.restore(); window.focus();});
}).catch(error=>{dialog.showErrorBox('無法啟動',String(error.message));app.quit();});
app.on('window-all-closed',()=>app.quit());
app.on('before-quit',event=>{
  if (jobs && !quitting) {event.preventDefault();quitting=true;void jobs.shutdown().finally(()=>app.quit());}
});
