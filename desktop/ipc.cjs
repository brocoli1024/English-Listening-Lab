function registerIpc({ipcMain,window,jobs,audioStore,openProjectPage}) {
  const methods = {
    openProjectPage:(_owner,key)=>openProjectPage(key),
    inspectYouTube:(owner,url)=>jobs.inspect(url,owner),
    startYouTube:(owner,id)=>jobs.start(id,owner),
    waitYouTube:(owner,id)=>jobs.wait(id,owner),
    cancelYouTube:(owner,id)=>jobs.cancel(id,owner),
    releaseYouTube:(owner,id)=>jobs.release(id,owner),
    saveAudio:(owner,id,input)=>audioStore.save(id,input,owner),
    resolveAudio:(_owner,id)=>audioStore.resolve(id),
    removeAudio:(_owner,id)=>audioStore.remove(id),
  };
  for (const [method,handler] of Object.entries(methods)) ipcMain.handle(`studio:${method}`,async(event,...args)=>{
    try {
      if (event.sender !== window.webContents || event.senderFrame !== window.webContents.mainFrame || !/^app:\/\/studio\/(?:index\.html)?(?:[?#].*)?$/.test(event.senderFrame.url)) throw new Error('無法接受這個頁面的請求。');
      if (args.length > 2 || (typeof args[0] !== 'string') || args[0].length > 2048) throw new Error('匯入參數無效。');
      return {ok:true,value:await handler(event.sender.id,...args)};
    } catch(error) {
      // Only locally authored Chinese messages cross the process boundary.
      const message = error instanceof Error && /^[\u3400-\u9fff]/.test(error.message) && error.message.length < 180 ? error.message : '處理失敗，請重試或重新安裝桌面版。';
      return {ok:false,message};
    }
  });
}
module.exports = {registerIpc};
