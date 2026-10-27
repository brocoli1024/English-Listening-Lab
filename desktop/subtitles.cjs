// Match known caption directions only; bracketed lyrics remain intact.
const soundCue = /^(?:(?:(?:upbeat|soft|gentle|quiet|loud|background|instrumental|dramatic|cheerful|sad|somber|tense|suspenseful|mellow|slow|fast|light|lively)\s+)*music(?:\s+(?:playing|fades|continues|ends))?|(?:audience\s+)?(?:applause|applauding|cheering|clapping|laughter|laughing)|silence)$/i;

function normalizeCaptions(json3) {
  if (!json3 || !Array.isArray(json3.events) || json3.events.length > 20000) throw new Error('字幕格式無法讀取，請改選 TXT 或 LRC。');
  const rows = [];
  let characters = 0;
  for (const event of [...json3.events].sort((a,b) => a.tStartMs-b.tStartMs)) {
    if (!Number.isFinite(event.tStartMs) || event.tStartMs < 0 || !Array.isArray(event.segs)) continue;
    let text = event.segs.map(seg => typeof seg.utf8 === 'string' ? seg.utf8 : '').join('').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#39;|&apos;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();
    characters += text.length;
    if (characters > 300000) throw new Error('字幕超過 300,000 字元。');
    text = text.replace(/\(([^()[\]]*)\)|\[([^()[\]]*)\]/g, (match, round, square) => soundCue.test((round ?? square).trim()) ? ' ' : match).replace(/\s+/g,' ').trim();
    if (!text) continue;
    const row = {start:event.tStartMs,end:event.tStartMs+Math.max(0,Number(event.dDurationMs)||0),text};
    const previous = rows.at(-1);
    if (previous && row.start < previous.end && (row.text === previous.text || row.text.startsWith(previous.text + ' '))) {
      previous.text = row.text;
      previous.end = Math.max(previous.end,row.end);
    } else rows.push(row);
  }
  if (!rows.some(row => /[a-z]/i.test(row.text))) throw new Error('沒有可用的英文字幕，請選擇 TXT 或 LRC 歌詞。');
  if (rows.length > 1500) throw new Error('字幕超過 1,500 行。');
  return rows.map(row => {
    const centiseconds = Math.floor(row.start/10);
    return `[${String(Math.floor(centiseconds/6000)).padStart(2,'0')}:${String(Math.floor(centiseconds/100)%60).padStart(2,'0')}.${String(centiseconds%100).padStart(2,'0')}]${row.text}`;
  }).join('\n');
}
module.exports = {normalizeCaptions};
