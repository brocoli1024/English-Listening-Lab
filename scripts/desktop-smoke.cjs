// This entry point is test-only and is excluded from packaged applications.
const path=require('node:path');
const fs=require('node:fs/promises');
const {app}=require('electron');
if(!process.env.LISTENING_LAB_TEST_DATA_DIR || !path.resolve(process.env.LISTENING_LAB_TEST_DATA_DIR).startsWith(path.resolve(__dirname,'../desktop/.test-data')+path.sep)) throw Error('An isolated workspace test profile is required');
const testRoot=process.env.LISTENING_LAB_TEST_DATA_DIR;
let completed=false;
const deadline=setTimeout(()=>{console.error('Desktop smoke timed out');app.exit(1);},45000);
app.on('browser-window-created',(_event,window)=>{
  window.webContents.once('did-finish-load',async()=>{
    try {
      await new Promise(resolve=>setTimeout(resolve,1800));
      const state=await window.webContents.executeJavaScript(`({text:document.body.innerText,bridge:!!window.listeningLab,node:typeof window.require})`);
      if(!state.bridge || state.node!=='undefined' || !/listening/i.test(state.text)) throw Error(`Unexpected renderer: ${JSON.stringify(state)}`);
      const audioDir=path.resolve(__dirname,'../assets/audio');
      const name=(await fs.readdir(audioDir)).find(name=>name.endsWith('.wav'));
      const bytes=await fs.readFile(path.join(audioDir,name));
      await window.webContents.executeJavaScript(`(async()=>{
        const bytes=Uint8Array.from(atob(${JSON.stringify(bytes.toString('base64'))}),c=>c.charCodeAt(0));
        await window.listeningLab.saveAudio('smoke-audio',{kind:'bytes',name:'smoke.wav',bytes});
        localStorage.setItem('desktop-smoke-marker','persisted');
        const uri=await window.listeningLab.resolveAudio('smoke-audio');
        const response=await fetch(uri,{headers:{Range:'bytes=0-31'}});
        if(response.status!==206 || (await response.arrayBuffer()).byteLength!==32) throw Error('Range playback request failed');
        const audio=new Audio(uri); await audio.play(); await new Promise(r=>setTimeout(r,800));
        if(audio.currentTime<=0) throw Error('Audio did not play'); audio.pause();
      })()`);
      const reloaded=new Promise(resolve=>window.webContents.once('did-finish-load',resolve));
      window.webContents.reload();await reloaded;
      await new Promise(resolve=>setTimeout(resolve,1800));
      await window.webContents.executeJavaScript(`(async()=>{if(localStorage.getItem('desktop-smoke-marker')!=='persisted') throw Error('Storage lost'); await window.listeningLab.resolveAudio('smoke-audio'); await window.listeningLab.removeAudio('smoke-audio');localStorage.removeItem('desktop-smoke-marker');})()`);
      await fs.mkdir(testRoot,{recursive:true});
      await fs.writeFile(path.join(testRoot,'desktop.png'),(await window.webContents.capturePage()).toPNG());
      await window.webContents.executeJavaScript(`(()=>{const button=[...document.querySelectorAll('[role="button"]')].find(el=>el.textContent.includes('匯入我的歌曲'));if(!button)throw Error('Import entry missing');button.click();})()`);
      await new Promise(resolve=>setTimeout(resolve,800));
      await window.webContents.executeJavaScript(`(()=>{const button=[...document.querySelectorAll('[role="radio"]')].find(el=>el.textContent.includes('YouTube'));if(!button)throw Error('YouTube source missing');button.click();})()`);
      await new Promise(resolve=>setTimeout(resolve,400));
      const importText=await window.webContents.executeJavaScript('document.body.innerText');
      if(!importText.includes('檢查影片')) throw Error('YouTube import form missing');
      await fs.writeFile(path.join(testRoot,'youtube-import.png'),(await window.webContents.capturePage()).toPNG());
      completed=true;console.log('PASS: isolated desktop, restricted bridge, range audio playback and reload persistence');
      clearTimeout(deadline);app.quit();
    } catch(error) {console.error(error);clearTimeout(deadline);app.exit(1);}
  });
});
app.on('quit',()=>{if(!completed) process.exitCode=1;});
require('../desktop/main.cjs');
