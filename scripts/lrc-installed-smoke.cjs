const fs=require('node:fs/promises');
const path=require('node:path');
const {spawn}=require('node:child_process');
async function main() {
  const executable=path.resolve(process.argv[2]||'release/win-unpacked/English Listening Lab.exe');
  const profile=path.resolve('desktop/.test-data/lrc-acceptance');
  const restarting=process.argv[3]==='restart';
  const port=19347;
  const child=spawn(executable,[`--remote-debugging-port=${port}`,'--remote-debugging-address=127.0.0.1'],{windowsHide:true,stdio:'ignore',env:{...process.env,LISTENING_LAB_TEST_DATA_DIR:profile}});
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

    const lyrics=await fs.readFile(process.argv[3], 'utf8');
    async function click(text) {
      await evaluate(`(()=>{const e=[...document.querySelectorAll('[role="button"]')].find(e=>e.textContent.includes(${JSON.stringify(text)}));if(!e)throw Error("Missing button");e.click();})()`);
      await pause(500);
    }
    await click('匯入我的歌曲');
    await evaluate('(()=>{const raw='+JSON.stringify(lyrics)+';const dispatch=EventTarget.prototype.dispatchEvent;HTMLInputElement.prototype.dispatchEvent=function(event){if(this.type!=="file"||event.type!=="click")return dispatch.call(this,event);const transfer=new DataTransfer();transfer.items.add(new File([raw],"original.lrc",{type:"text/plain"}));this.files=transfer.files;return dispatch.call(this,new Event("change",{bubbles:true}));};})()');
    await click('選擇歌詞檔');
    const preview=await evaluate('document.body.innerText');
    if(!preview.includes('73 句歌詞') || preview.includes('The Weeknd - Die For You')) throw Error('Original LRC preview incorrect: '+preview);
    const saved=await evaluate('localStorage.getItem("@english-listening/imports-v1")');
    if(saved && JSON.parse(saved).length)throw Error('Unexpected saved test song');
    await evaluate(`(()=>{const e=[...document.querySelectorAll('[role="heading"]')].find(e=>e.textContent==='練習預覽');if(e)e.scrollIntoView({block:'center'});})()`);
    await pause(300);
    const shot=await send('Page.captureScreenshot',{format:'png'});await fs.mkdir(profile,{recursive:true});await fs.writeFile(path.join(profile,'packaged.png'),Buffer.from(shot.data,'base64'));
    console.log('PASS: installed app, original LRC -> 73-line preview, opening credit excluded, no saved test songs');
    await send('Browser.close').catch(()=>{});
  } finally {
    socket?.close();
    if(child.exitCode===null) {await Promise.race([new Promise(resolve=>child.once('exit',resolve)),pause(5000)]);if(child.exitCode===null)child.kill();}
  }
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
