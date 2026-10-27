// Offline integration test: fake downloader, real IPC, renderer and disk store.
// Never included in a production package.
const path=require('node:path');
const fs=require('node:fs/promises');
const {app}=require('electron');
const testRoot=process.env.LISTENING_LAB_TEST_DATA_DIR;
if(!testRoot || !path.resolve(testRoot).startsWith(path.resolve(__dirname,'../desktop/.test-data')+path.sep)) throw Error('Isolated profile required');
const missing=process.env.LISTENING_LAB_SMOKE_MISSING==='1';
const jobsModule=require('../desktop/jobs.cjs');
const realCreate=jobsModule.createJobManager;
jobsModule.createJobManager=options=>realCreate({...options,runner:async(_exe,args,{cwd,signal})=>{
  if(signal.aborted) throw Error('cancelled');
  if(args.includes('--dump-single-json')) return {stdout:JSON.stringify({id:'abcdefghijk',title:'Isolated smoke song',duration:20,subtitles:missing?{}:{en:[{ext:'json3'}]}})};
  if(args.includes('--extract-audio')) await fs.copyFile(path.resolve(__dirname,'../assets/audio/twinkle-twinkle-vocal.wav'),path.join(cwd,'audio.mp3'));
  else await fs.writeFile(path.join(cwd,'captions.en.json3'),JSON.stringify({events:[{tStartMs:0,segs:[{utf8:'Hello world we sing together'}]},{tStartMs:4000,segs:[{utf8:'Listen to the music today'}]}]}));
  return {stdout:''};
}});
const deadline=setTimeout(()=>{console.error('Import smoke timed out');app.exit(1);},60000);
app.on('browser-window-created',(_event,window)=>window.webContents.once('did-finish-load',async()=>{
  const execute=code=>window.webContents.executeJavaScript(code);
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  async function click(role,text) {
    await execute(`(()=>{const el=[...document.querySelectorAll('[role="${role}"]')].find(el=>el.textContent.includes(${JSON.stringify(text)}));if(!el)throw Error('Missing '+${JSON.stringify(text)});el.click();})()`);await wait(350);
  }
  async function contains(text) {for(let i=0;i<30;i++){if(await execute(`document.body.innerText.includes(${JSON.stringify(text)})`))return;await wait(150);}throw Error('Missing state: '+text);}
  try {
    await wait(1400);await click('button','匯入我的歌曲');await click('radio','YouTube');
    await execute(`(()=>{const el=document.querySelector('[aria-label="YouTube 影片網址"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,'https://youtu.be/abcdefghijk');el.dispatchEvent(new Event('input',{bubbles:true}));})()`);
    await wait(250);await click('button','檢查影片');await contains('Isolated smoke song');
    await click('button','下載並準備練習');
    await contains(missing?'未找到可用英文字幕':'音檔與英文字幕已準備好');
    if(missing) {
      const disabled=await execute(`(()=>{const el=[...document.querySelectorAll('[role="button"]')].find(el=>el.textContent.includes('儲存並開始練習'));return el.getAttribute('aria-disabled')==='true';})()`);
      if(!disabled) throw Error('Incomplete song can be saved');
      await execute(`(()=>{const original=EventTarget.prototype.dispatchEvent;HTMLInputElement.prototype.dispatchEvent=function(event){if(this.type!=='file'||event.type!=='click')return original.call(this,event);const transfer=new DataTransfer();transfer.items.add(new File(['Hello world we sing together\\nListen to the music today'],'smoke.txt',{type:'text/plain'}));this.files=transfer.files;return original.call(this,new Event('change',{bubbles:true}));};})()`);
      await click('button','選擇歌詞檔');
    }
    await contains('練習預覽');
    await fs.mkdir(testRoot,{recursive:true});await fs.writeFile(path.join(testRoot,'prepared.png'),(await window.webContents.capturePage()).toPNG());
    await click('button','儲存並開始練習');await wait(700);
    const saved=await execute(`JSON.parse(localStorage.getItem('@english-listening/imports-v1')||'[]')`);
    if(saved.length!==1 || saved[0].title!=='Isolated smoke song' || !saved[0].audioSource.uri.startsWith('app://studio/audio/')) throw Error('Persistent song metadata missing');
    await execute(`window.listeningLab.resolveAudio(${JSON.stringify(saved[0].id)})`);
    console.log(`PASS: ${missing?'missing subtitles + TXT':'English subtitles'} -> preview -> durable song; isolated profile only`);
    clearTimeout(deadline);app.quit();
  }catch(error){console.error(error);console.error(await execute('document.body.innerText'));await fs.mkdir(testRoot,{recursive:true});await fs.writeFile(path.join(testRoot,'failure.png'),(await window.webContents.capturePage()).toPNG());clearTimeout(deadline);app.exit(1);}
}));
require('../desktop/main.cjs');
