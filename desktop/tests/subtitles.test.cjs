const {test} = require('node:test');
const a = require('node:assert/strict');
const {normalizeCaptions} = require('../subtitles.cjs');

test('omit bracketed sound cues while retaining lyric timestamps', () => {
  const events = [
    [0,'(upbeat music)'], [1000,'[Music]'], [2000,'[Applause]'],
    [3000,'(soft instrumental music)'], [4500,'Hello world'],
    [6000,'(audience cheering)'], [7500,'Sing with me'],
  ].map(([tStartMs,utf8]) => ({tStartMs,segs:[{utf8}]}));
  a.equal(normalizeCaptions({events}),'[00:04.50]Hello world\n[00:07.50]Sing with me');
});

test('remove inline sound cues but preserve ordinary parentheses and lyric words', () => {
  const events = [
    [1000,'[Music] Hello (upbeat music) world [applause]'],
    [2000,'Stay (with me) and [sing along]'],
    [3000,'Music is my life (music is my life)'],
    [4000,'We sing music and applause'],
  ].map(([tStartMs,utf8]) => ({tStartMs,segs:[{utf8}]}));
  a.equal(normalizeCaptions({events}),'[00:01.00]Hello world\n[00:02.00]Stay (with me) and [sing along]\n[00:03.00]Music is my life (music is my life)\n[00:04.00]We sing music and applause');
});

test('sound cues alone do not count as usable English subtitles', () => {
  const events = ['(upbeat music)','[Music]','[Applause]'].map((utf8,index) => ({tStartMs:index*1000,segs:[{utf8}]}));
  a.throws(() => normalizeCaptions({events}), /沒有可用的英文字幕/);
});
test('merge only overlapping rolling prefixes, preserve later choruses', () => {
  const events = [[1000,2000,'Hello'],[1500,2000,'Hello world'],[9000,1000,'Hello world']].map(([tStartMs,dDurationMs,utf8]) => ({tStartMs,dDurationMs,segs:[{utf8}]}));
  a.equal(normalizeCaptions({events}),'[00:01.00]Hello world\n[00:09.00]Hello world');
});
test('sort, strip tags and reject empty/non-English/oversize captions', () => {
  a.equal(normalizeCaptions({events:[{tStartMs:2000,segs:[{utf8:'<i>World</i>'}]},{tStartMs:0,segs:[{utf8:'Hello &amp; goodbye'}]}]}),'[00:00.00]Hello & goodbye\n[00:02.00]World');
  for (const text of ['', '你好', 'a'.repeat(300001)]) a.throws(() => normalizeCaptions({events:[{tStartMs:0,segs:[{utf8:text}]}]}));
});
