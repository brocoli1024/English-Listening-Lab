function normalizeYouTubeUrl(input) {
  if (typeof input !== 'string' || input.length > 2048) throw new Error('請貼上單首 YouTube 影片網址。');
  let url;
  try { url = new URL(input.trim()); } catch { throw new Error('請貼上完整的 YouTube 網址。'); }
  if (url.protocol !== 'https:' || url.port || url.username || url.password) throw new Error('請使用 HTTPS YouTube 網址。');
  let videoId;
  if (url.hostname === 'youtu.be') videoId = url.pathname.slice(1);
  else if (['youtube.com','www.youtube.com','m.youtube.com'].includes(url.hostname)) {
    if (url.pathname === '/watch') videoId = url.searchParams.get('v');
    else if (url.pathname.startsWith('/shorts/')) videoId = url.pathname.slice(8);
  }
  if (!/^[\w-]{11}$/.test(videoId || '')) throw new Error('請選擇單首公開影片，不能匯入播放清單。');
  return {videoId,url:`https://www.youtube.com/watch?v=${videoId}`};
}
function selectEnglishSubtitle(metadata) {
  for (const [field,kind] of [['subtitles','manual'],['automatic_captions','automatic']]) {
    const tracks = metadata[field] || {};
    const language = Object.keys(tracks).filter(key => /^en(?:-|$)/i.test(key)).sort((a,b) => (a === 'en' ? -1 : b === 'en' ? 1 : a.localeCompare(b))).find(key => Array.isArray(tracks[key]) && tracks[key].some(track => track.ext === 'json3'));
    if (language) return {kind,language};
  }
  return {kind:'none',language:null};
}
function parseVideoInfo(metadata) {
  if (!metadata || !/^[\w-]{11}$/.test(metadata.id || '') || metadata._type === 'playlist') throw new Error('無法讀取單首影片。');
  if (metadata.is_live || ['is_live','is_upcoming','post_live'].includes(metadata.live_status)) throw new Error('目前不支援直播或尚未發布的影片。');
  if (metadata.availability && !['public','unlisted'].includes(metadata.availability)) throw new Error('請使用不需登入或付費的公開影片。');
  if (!Number.isFinite(metadata.duration) || metadata.duration <= 0 || metadata.duration > 1200) throw new Error('影片需有明確長度，且不能超過 20 分鐘。');
  const subtitle = selectEnglishSubtitle(metadata);
  return {videoId:metadata.id,title:String(metadata.title || 'YouTube 歌曲').slice(0,120),durationSeconds:metadata.duration,subtitleKind:subtitle.kind,subtitleLanguage:subtitle.language};
}
module.exports = {normalizeYouTubeUrl,selectEnglishSubtitle,parseVideoInfo};
