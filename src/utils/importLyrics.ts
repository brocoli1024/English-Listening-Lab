import { Difficulty, type Song, type LyricLine } from '../model/Song';

export type ParsedLyrics = { lyrics: LyricLine[]; synced: boolean };
export const blankRatios = { [Difficulty.Easy]: 0.2, [Difficulty.Medium]: 0.35, [Difficulty.Hard]: 0.5 };
export const difficultyLabels = { [Difficulty.Easy]: '簡單', [Difficulty.Medium]: '中等', [Difficulty.Hard]: '困難' };
const words = /[\p{L}\p{N}_]+(?:['’][\p{L}\p{N}_]+)*/gu;
const englishWord = /^[a-z]+(?:['’][a-z]+)*$/i;

export function parseLyrics(text: string, filename: string): ParsedLyrics {
  if (!/\.(txt|lrc)$/i.test(filename)) throw new Error('請選擇 TXT 或 LRC 歌詞檔。');
  if (text.length > 300_000) throw new Error('歌詞過長，請使用 300,000 字元以內的檔案。');
  if (/[\u0000\uFFFD]/u.test(text)) throw new Error('無法讀取歌詞，請另存為 UTF-8 文字檔。');
  const synced = /\.lrc$/i.test(filename);
  const rows = text.replace(/^\uFEFF/, '').split(/\r\n|[\r\n]/);
  const lyrics: LyricLine[] = [];
  const metadata = new Map<string, string>();
  const metadataRow = /^\s*\[([a-z][a-z0-9_-]*)\s*:\s*([^\]]*)\]\s*$/i;
  let offset = 0;
  if (synced) rows.forEach((row, index) => {
    const match = row.match(metadataRow);
    if (!match) return;
    const key = match[1].toLowerCase(), value = match[2].trim();
    if (key === 'offset') {
      if (!/^[+-]?\d+$/.test(value) || !Number.isSafeInteger(Number(value))) {
        throw new Error(`LRC 第 ${index + 1} 行的 offset 必須是整數毫秒，例如 [offset: 1000]。`);
      }
      offset = Number(value) / 1000;
    }
    metadata.set(key, value);
  });
  const normalize = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase();
  const artist = metadata.get('ar'), title = metadata.get('ti');
  const header = artist && title ? normalize(`${artist} - ${title}`) : null;
  for (const [index, row] of rows.entries()) {
    if (!row.trim()) continue;
    if (!synced) {
      lyrics.push({ timestamp: 0, english: row, chinese: '', blankedWords: [] });
      continue;
    }
    if (metadataRow.test(row)) continue;
    const stamps = [...row.matchAll(/\[(\d{1,3}):([0-5]\d)(?:[.:](\d{1,3}))?\]/g)];
    const content = row.replace(/\[(\d{1,3}):([0-5]\d)(?:[.:](\d{1,3}))?\]/g, '').trim();
    if (!stamps.length || /\[[^\]]*\]/.test(content)) throw new Error(`LRC 第 ${index + 1} 行需有有效時間，例如 [00:12.50]Hello。`);
    if (!content) continue;
    for (const stamp of stamps) {
      const rawTime = Number(stamp[1]) * 60 + Number(stamp[2]) + Number(`0.${stamp[3] ?? '0'}`);
      // Only a confirmed opening artist/title credit is omitted, never title-only lyrics.
      if (!lyrics.length && rawTime === 0 && header && normalize(content) === header) continue;
      const time = rawTime + offset;
      lyrics.push({ timestamp: Math.max(0, time), english: content, chinese: '', blankedWords: [] });
    }
  }
  if (lyrics.length > 1500) throw new Error('歌詞最多支援 1,500 行。');
  if (!lyrics.some(line => [...line.english.matchAll(words)].some(match => englishWord.test(match[0])))) {
    throw new Error('歌詞中沒有可練習的英文單字。');
  }
  if (synced) lyrics.sort((a, b) => a.timestamp - b.timestamp);
  return { lyrics, synced };
}

function hash(value: string): number {
  let result = 2166136261;
  for (let i = 0; i < value.length; i++) result = Math.imul(result ^ value.charCodeAt(i), 16777619);
  return result >>> 0;
}

export function prepareExercise(song: Song, difficulty: Difficulty): Song {
  const candidates = song.lyrics.flatMap((line, lineIndex) => {
    if (/^\s*\[.*\]\s*$/.test(line.english)) return [];
    return [...line.english.matchAll(words)].flatMap((match, tokenIndex) => englishWord.test(match[0])
      ? [{ lineIndex, tokenIndex, word: match[0], rank: hash(`${song.id}:${lineIndex}:${tokenIndex}:${match[0]}`) }] : []);
  });
  const count = Math.min(candidates.length, Math.max(1, Math.round(candidates.length * blankRatios[difficulty])));
  const selected = candidates.sort((a, b) => a.rank - b.rank || a.lineIndex - b.lineIndex || a.tokenIndex - b.tokenIndex).slice(0, count);
  return {
    ...song, difficulty, exerciseVersion: 1,
    lyrics: song.lyrics.map((line, index) => {
      const blanks = selected.filter(item => item.lineIndex === index).sort((a, b) => a.tokenIndex - b.tokenIndex);
      return { ...line, blankedWords: blanks.map(item => item.word), blankTokenIndices: blanks.map(item => item.tokenIndex) };
    }),
  };
}

export function exerciseKey(song: Song): string {
  return song.exerciseVersion ? `${song.id}:rules-${song.exerciseVersion}:${song.difficulty}` : song.id;
}
