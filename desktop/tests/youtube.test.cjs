const {test} = require('node:test');
const a = require('node:assert/strict');
const {normalizeYouTubeUrl, parseVideoInfo, selectEnglishSubtitle} = require('../youtube.cjs');
test('normalize only HTTPS single video URLs', () => {
  for (const url of ['https://youtu.be/abcdefghijk','https://www.youtube.com/watch?v=abcdefghijk&list=other','https://youtube.com/shorts/abcdefghijk']) a.equal(normalizeYouTubeUrl(url).url,'https://www.youtube.com/watch?v=abcdefghijk');
  for (const url of ['https://youtube.com.evil/watch?v=abcdefghijk','http://youtu.be/abcdefghijk','https://user@youtube.com/watch?v=abcdefghijk','https://youtube.com/playlist?list=abc','https://youtu.be/abc']) a.throws(() => normalizeYouTubeUrl(url));
});
test('metadata enforces duration, access and subtitle priority', () => {
  const info = {id:'abcdefghijk',title:'Hello',duration:1200,availability:'public',subtitles:{'en-US':[{ext:'json3'}]},automatic_captions:{en:[{ext:'json3'}]}};
  a.equal(parseVideoInfo(info).subtitleKind,'manual');
  a.deepEqual(selectEnglishSubtitle({}),{kind:'none',language:null});
  for (const change of [{duration:1201},{duration:0},{is_live:true},{availability:'needs_auth'},{live_status:'is_upcoming'}]) a.throws(() => parseVideoInfo({...info,...change}));
});
