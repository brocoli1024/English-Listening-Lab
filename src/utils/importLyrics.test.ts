import { parseLyrics, prepareExercise, exerciseKey } from './importLyrics';
import { Difficulty, type Song } from '../model/Song';
import { buildLyricParts } from './lyrics';

const song: Song = { id: 'test', title: 'Test', artist: 'Me', difficulty: Difficulty.Easy, accentColor: '#000', audioSource: 1,
  lyrics: [{ timestamp: 0, english: "Hello, hello! Don't stop believing in the music tonight, darling.", chinese: '', blankedWords: [] }] };

it('reads BOM and CRLF text without inventing synchronization', () => {
  const parsed = parseLyrics('\uFEFFHello, world!\r\n\r\nStay here.', 'song.TXT');
  expect(parsed.synced).toBe(false);
  expect(parsed.lyrics.map(line => line.english)).toEqual(['Hello, world!', 'Stay here.']);
});

it('sorts LRC timestamps, expands repetitions and applies millisecond offsets', () => {
  const parsed = parseLyrics('[ti:Song]\n[offset:-500]\n[00:12.50][00:20.000]Hello!\n[00:02.25]Stay here.', 'song.lrc');
  expect(parsed.synced).toBe(true);
  expect(parsed.lyrics.map(line => [line.timestamp, line.english])).toEqual([[1.75, 'Stay here.'], [12, 'Hello!'], [19.5, 'Hello!']]);
});

it.each(['', '[ar:Someone]', '[00:99.00]Hello', 'Hello without timestamps'])('rejects invalid LRC: %s', text => {
  expect(() => parseLyrics(text, 'song.lrc')).toThrow();
});

it('rejects unsupported, oversized, binary and non-English lyrics', () => {
  expect(() => parseLyrics('Hello', 'file.pdf')).toThrow();
  expect(() => parseLyrics('x'.repeat(300_001), 'file.txt')).toThrow();
  expect(() => parseLyrics('Hello\u0000world', 'file.txt')).toThrow();
  expect(() => parseLyrics('只有中文 123', 'file.txt')).toThrow();
});

it('creates deterministic nested exercises with 20%, 35%, 50% of ten words', () => {
  const exercises = Object.values(Difficulty).map(d => prepareExercise(song, d));
  expect(exercises.map(s => s.lyrics[0].blankedWords.length)).toEqual([2, 4, 5]);
  expect(prepareExercise(song, Difficulty.Easy)).toEqual(exercises[0]);
  const indices = exercises.map(s => s.lyrics[0].blankTokenIndices!);
  expect(indices[0].every(i => indices[1].includes(i))).toBe(true);
  expect(indices[1].every(i => indices[2].includes(i))).toBe(true);
  expect(song.lyrics[0].blankedWords).toEqual([]);
});

it('renders the selected occurrence of repeated words while preserving punctuation', () => {
  expect(buildLyricParts('Go, go! Don’t stop.', ['go'], [1])).toEqual([
    { kind: 'text', value: 'Go, ' }, { kind: 'blank', value: 'go', blankIndex: 0 }, { kind: 'text', value: '! Don’t stop.' },
  ]);
});

it('uses separate draft keys by difficulty and preserves legacy authored keys', () => {
  expect(exerciseKey(song)).toBe('test');
  expect(exerciseKey(prepareExercise(song, Difficulty.Easy))).not.toBe(exerciseKey(prepareExercise(song, Difficulty.Hard)));
});

it('accepts standalone provider metadata and whitespace around millisecond offsets', () => {
  const parsed = parseLyrics('[id: provider-123]\n[custom_tag: extra]\n[offset: +1000 ]\n[00:02.25]Stay here.', 'song.lrc');
  expect(parsed.lyrics.map(line => [line.timestamp, line.english])).toEqual([[3.25, 'Stay here.']]);
});

it('excludes only a zero-time artist/title header confirmed by metadata', () => {
  const parsed = parseLyrics('[ar: Sample Artist]\n[ti: Sample Song]\n[offset: 1000]\n[00:00.00]Sample Artist - Sample Song\n[00:05.00]Sample Song\n[00:10.00]Sample Artist - Sample Song', 'song.lrc');
  expect(parsed.lyrics.map(line => [line.timestamp, line.english])).toEqual([[6, 'Sample Song'], [11, 'Sample Artist - Sample Song']]);
});

it('preserves unconfirmed opening text and TXT headers', () => {
  expect(parseLyrics('[00:00.00]Sample Artist - Sample Song', 'song.lrc').lyrics).toHaveLength(1);
  expect(parseLyrics('[ar: Another Artist]\n[ti: Sample Song]\n[00:00.00]Sample Artist - Sample Song', 'song.lrc').lyrics).toHaveLength(1);
  expect(parseLyrics('Sample Artist - Sample Song', 'song.txt').lyrics).toHaveLength(1);
});

it('reports the original line number for malformed timestamps and offsets', () => {
  expect(() => parseLyrics('[ti: Song]\n\n[00:99.00]Hello', 'song.lrc')).toThrow('第 3 行');
  expect(() => parseLyrics('[offset: nope]\n[00:01.00]Hello', 'song.lrc')).toThrow('第 1 行');
});
