const {test} = require('node:test');
const a = require('node:assert/strict');
const {registerIpc}=require('../ipc.cjs');
test('bridge rejects unknown windows, child frames and arbitrary pages',async()=>{
  const handlers={}; const mainFrame={url:'app://studio/'};
  const contents={id:7,mainFrame};
  registerIpc({ipcMain:{handle:(name,fn)=>handlers[name]=fn},window:{webContents:contents},jobs:{inspect:async()=>({title:'ok'})},audioStore:{}});
  const invoke=handlers['studio:inspectYouTube'];
  a.equal((await invoke({sender:contents,senderFrame:mainFrame},'url')).ok,true);
  for(const event of [{sender:{id:7},senderFrame:mainFrame},{sender:contents,senderFrame:{url:'app://studio/'}},{sender:contents,senderFrame:null}]) a.equal((await invoke(event,'url')).ok,false);
  mainFrame.url='https://evil.invalid/';
  a.equal((await invoke({sender:contents,senderFrame:mainFrame},'url')).ok,false);
});

test('project page requests require the trusted main frame',async()=>{
  const handlers={};const frame={url:'app://studio/'};const contents={id:8,mainFrame:frame};const pages=[];
  registerIpc({ipcMain:{handle:(name,fn)=>handlers[name]=fn},window:{webContents:contents},jobs:{},audioStore:{},openProjectPage:async key=>pages.push(key)});
  const invoke=handlers['studio:openProjectPage'];
  a.equal((await invoke({sender:contents,senderFrame:frame},'downloads')).ok,true);
  a.equal((await invoke({sender:contents,senderFrame:{url:frame.url}},'downloads')).ok,false);
  a.equal((await invoke({sender:{id:8},senderFrame:frame},'downloads')).ok,false);
  a.deepEqual(pages,['downloads']);
});
