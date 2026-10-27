const fs=require('node:fs/promises');
const path=require('node:path');
const {spawn}=require('node:child_process');
async function main() {
  const executable=path.resolve('node_modules/electron/dist/electron.exe');
  const profile=path.resolve('desktop/.test-data/delete-song-smoke');
  const port=19349;
  const child=spawn(executable,[path.resolve('desktop/main.cjs'),`--remote-debugging-port=${port}`,'--remote-debugging-address=127.0.0.1'],{windowsHide:true,stdio:'ignore',env:{...process.env,LISTENING_LAB_TEST_DATA_DIR:profile}});
  let socket;
  const pending=new Map();let id=0;
  const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  try {
    let target;
    for(let i=0;i<80;i++) {
      try {target=(await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(item=>item.type==='page' && item.url.startsWith('app://studio'));if(target)break;}catch{}
      await pause(250);
    }
    if(!target)throw Error('Packaged window did not start');
    socket=new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
    socket.addEventListener('message',event=>{const message=JSON.parse(event.data);const handler=pending.get(message.id);if(handler){pending.delete(message.id);message.error?handler.reject(Error(message.error.message)):handler.resolve(message.result);}});
    function send(method,params={}) {return new Promise((resolve,reject)=>{const messageId=++id;const timeout=setTimeout(()=>{pending.delete(messageId);reject(Error(`CDP timeout: ${method}`));},15000);pending.set(messageId,{resolve:value=>{clearTimeout(timeout);resolve(value);},reject:error=>{clearTimeout(timeout);reject(error);}});socket.send(JSON.stringify({id:messageId,method,params}));});}
    async function evaluate(expression){const value=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(value.exceptionDetails)throw Error(JSON.stringify(value.exceptionDetails));return value.result.value;}
    await pause(1600);
    const body=await evaluate('document.body.innerText');if(!/listening/i.test(body))throw Error('Application content missing');
    const fixture={id:'delete-fixture',title:'Delete acceptance fixture',artist:'Test',difficulty:'Easy',accentColor:'#000',imported:true,synced:false,audioSource:{uri:'app://studio/audio/delete-fixture'},lyrics:[{timestamp:0,english:'Hello friendly world',chinese:'',blankedWords:[]}]};
    const bytes=await fs.readFile(path.resolve('assets/audio/twinkle-twinkle-vocal.wav'));
    await evaluate(`(async()=>{
      await window.listeningLab.removeAudio('delete-fixture');
      await window.listeningLab.saveAudio('delete-fixture',{kind:'bytes',name:'fixture.wav',bytes:Uint8Array.from(atob(${JSON.stringify(bytes.toString('base64'))}),c=>c.charCodeAt(0))});
      localStorage.setItem('@english-listening/imports-v1',JSON.stringify([${JSON.stringify(fixture)}]));
      localStorage.setItem('@english-listening/draft/delete-fixture:rules-1:Easy',JSON.stringify({answer:'hello'}));
      localStorage.setItem('@english-listening/progress-v1',JSON.stringify({completedSongIds:['delete-fixture'],bestAccuracyBySong:{'delete-fixture':100},totalPractices:1,history:[{songId:'delete-fixture',accuracy:100,answers:{}}]}));
    })()`);
    await send('Page.reload'); await pause(1600);
    async function click(label) {
      await evaluate(`(()=>{const e=[...document.querySelectorAll('[role="button"]')].find(e=>e.textContent.trim()===${JSON.stringify(label)});if(!e)throw Error('Missing button: '+${JSON.stringify(label)});e.click();})()`);
      await pause(450);
    }
    await click('刪除歌曲');
    await evaluate(`(()=>{const e=[...document.querySelectorAll('[role="button"]')].find(e=>e.textContent.trim()==='確認刪除');e.scrollIntoView({block:'center'});})()`);
    await pause(300);
    const confirmation = await send('Page.captureScreenshot',{format:'png'});
    await fs.mkdir(profile,{recursive:true});
    await fs.writeFile(path.join(profile,'confirmation.png'),Buffer.from(confirmation.data,'base64'));
    await click('取消');
    await evaluate(`(async()=>{if(!JSON.parse(localStorage.getItem('@english-listening/imports-v1')).length)throw Error('Cancel removed song');await window.listeningLab.resolveAudio('delete-fixture');})()`);
    await click('刪除歌曲'); await click('確認刪除');
    await evaluate(`(async()=>{
      if(JSON.parse(localStorage.getItem('@english-listening/imports-v1')).length)throw Error('Song still saved');
      if(localStorage.getItem('@english-listening/draft/delete-fixture:rules-1:Easy'))throw Error('Draft remains');
      const p=JSON.parse(localStorage.getItem('@english-listening/progress-v1'));if(p.totalPractices!==0||p.completedSongIds.length||p.history.length)throw Error('Progress remains');
      let missing=false;try{await window.listeningLab.resolveAudio('delete-fixture');}catch{missing=true;}if(!missing)throw Error('Audio remains');
    })()`);
    await send('Page.reload'); await pause(1200);
    if((await evaluate('document.body.innerText')).includes('Delete acceptance fixture'))throw Error('Deleted song returns after reload');
    const shot=await send('Page.captureScreenshot',{format:'png'});await fs.mkdir(profile,{recursive:true});await fs.writeFile(path.join(profile,'packaged.png'),Buffer.from(shot.data,'base64'));
    console.log('PASS: confirmation cancel, delete audio/draft/results, reload persistence, isolated desktop profile');
    await send('Browser.close').catch(()=>{});
  } finally {
    socket?.close();
    if(child.exitCode===null) {await Promise.race([new Promise(resolve=>child.once('exit',resolve)),pause(5000)]);if(child.exitCode===null)child.kill();}
  }
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
