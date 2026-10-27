const path = require('node:path');
const fs = require('node:fs');
const { Readable } = require('node:stream');
const CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; media-src 'self' blob:; connect-src 'self' blob:; object-src 'none'; frame-src 'none'; base-uri 'none'";
function resolveAppPath(input, root) {
  if (typeof input !== 'string' || /%(?:2e|2f|5c|25)/i.test(input)) throw new Error('Invalid path');
  const url = new URL(input);
  if (url.protocol !== 'app:' || url.host !== 'studio' || url.username || url.password) throw new Error('Invalid origin');
  const name = decodeURIComponent(url.pathname);
  if (/[\\:\0]/.test(name) || name.split('/').includes('..')) throw new Error('Invalid path');
  const result = path.resolve(root, '.' + (name === '/' ? '/index.html' : name));
  if (!result.startsWith(path.resolve(root) + path.sep)) throw new Error('Invalid root');
  return result;
}
function parseByteRange(header, size) {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match || (!match[1] && !match[2])) throw new Error('Invalid range');
  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start < 0 || start >= size) throw new Error('Invalid range');
  return { start, end };
}
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon','.ttf':'font/ttf','.woff2':'font/woff2','.mp3':'audio/mpeg','.m4a':'audio/mp4','.wav':'audio/wav','.ogg':'audio/ogg','.aac':'audio/aac'};
async function serveFile(file, request) {
  if (!['GET', 'HEAD'].includes(request.method)) return new Response(null, {status:405});
  const stat = await fs.promises.lstat(file);
  if (!stat.isFile() || stat.isSymbolicLink()) return new Response(null, {status:404});
  let range;
  try { range = parseByteRange(request.headers.get('range'), stat.size); }
  catch { return new Response(null, {status:416,headers:{'Content-Range':`bytes */${stat.size}`}}); }
  const headers = {'Content-Type':mime[path.extname(file).toLowerCase()] || 'application/octet-stream','Accept-Ranges':'bytes','Content-Length':String(range ? range.end-range.start+1 : stat.size),'Content-Security-Policy':CSP,'X-Content-Type-Options':'nosniff'};
  if (range) headers['Content-Range'] = `bytes ${range.start}-${range.end}/${stat.size}`;
  const body = request.method === 'HEAD' ? null : Readable.toWeb(fs.createReadStream(file, range || {}));
  return new Response(body, {status:range ? 206 : 200,headers});
}
function registerDesktopProtocol({staticRoot, audioStore}) {
  require('electron').protocol.handle('app', async request => {
    try {
      const file = resolveAppPath(request.url, staticRoot);
      const url = new URL(request.url);
      return await serveFile(url.pathname.startsWith('/audio/') ? await audioStore.file(decodeURIComponent(url.pathname.slice(7))) : file, request);
    } catch { return new Response(null, {status:404}); }
  });
}
module.exports = {resolveAppPath, parseByteRange, serveFile, registerDesktopProtocol};
