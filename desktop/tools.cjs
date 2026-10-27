const path = require('node:path');
const fs = require('node:fs');
const {createHash} = require('node:crypto');
function verifyBytes(bytes,sha256) {
  if (!/^[a-f0-9]{64}$/.test(sha256) || createHash('sha256').update(bytes).digest('hex') !== sha256) throw new Error('工具校驗碼不符，已停止準備。');
}
function safeEntry(name) {
  if (typeof name !== 'string' || /[\\:\0]/.test(name) || name.startsWith('/') || name.split('/').includes('..')) throw new Error('不安全的壓縮檔路徑。');
  return name;
}
function resolveTools(root,verify=true) {
  const tools = {ytDlp:'yt-dlp.exe',ffmpeg:'ffmpeg.exe',ffprobe:'ffprobe.exe',node:'node.exe'};
  if(verify && fs.existsSync(path.resolve(root,'deno.exe'))) throw new Error('發現舊版 Deno 工具，請重新準備桌面版工具。');
  for (const key of Object.keys(tools)) {
    tools[key]=path.resolve(root,tools[key]);
    if(verify && !fs.existsSync(tools[key])) throw new Error(`缺少工具 ${path.basename(tools[key])}，請執行 npm run desktop:tools。`);
  }
  return tools;
}
module.exports = {verifyBytes,safeEntry,resolveTools};
