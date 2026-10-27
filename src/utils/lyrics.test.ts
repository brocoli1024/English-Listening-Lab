import { buildLyricParts, buildLyricRows, getActiveLineIndex, getLyricScrollOffset } from './lyrics';

describe('complete lyric tokenization', () => {
  it('matches whole words instead of substrings', () => {
    expect(buildLyricParts('There is the theme.', ['the'])).toEqual([
      { kind: 'text', value: 'There is ' },
      { kind: 'blank', value: 'the', blankIndex: 0 },
      { kind: 'text', value: ' theme.' },
    ]);
  });
  it('preserves punctuation, whitespace, and original case', () => {
    const lyric = '  Hello,\tWORLD!  It’s me—again.\n';
    const parts = buildLyricParts(lyric, ['hello', 'world', 'it’s']);
    expect(parts.map(part => part.value).join('')).toBe(lyric);
    expect(parts.filter(part => part.kind === 'blank').map(part => part.value)).toEqual(['Hello', 'WORLD', 'It’s']);
    expect(parts.filter(part => part.kind === 'text').map(part => part.value)).toEqual(['  ', ',\t', '!  ', ' me—again.\n']);
  });
  it('consumes repeated words in occurrence order only as often as requested', () => {
    expect(buildLyricParts('Go, go, GO!', ['go', 'GO'])).toEqual([
      { kind: 'blank', value: 'Go', blankIndex: 0 },
      { kind: 'text', value: ', ' },
      { kind: 'blank', value: 'go', blankIndex: 1 },
      { kind: 'text', value: ', GO!' },
    ]);
  });
  it('supports unordered targets and does not invent missing blanks', () => {
    expect(buildLyricParts('One two.', ['two', 'missing', 'one']).filter(p => p.kind === 'blank')).toEqual([
      { kind: 'blank', value: 'One', blankIndex: 2 },
      { kind: 'blank', value: 'two', blankIndex: 0 },
    ]);
    expect(buildLyricParts('Unchanged!', [])).toEqual([{ kind: 'text', value: 'Unchanged!' }]);
  });
  it('does not replace part of a contraction', () => {
    expect(buildLyricParts("Don't go", ['don'])).toEqual([{ kind: 'text', value: "Don't go" }]);
  });
  it('tracks timestamp boundaries including seeking backwards and intro', () => {
    const lines = [{ timestamp: 2 }, { timestamp: 5 }, { timestamp: 8 }];
    expect([0, 2, 4.9, 5, 9, 3].map(time => getActiveLineIndex(lines, time))).toEqual([-1, 0, 0, 1, 2, 0]);
  });
});

describe('lyric layout', () => {
  it('keeps punctuation attached to blanks without introducing spaces', () => {
    const rows = buildLyricRows(buildLyricParts('  Hello,\tWORLD!  ', ['hello', 'world']));
    expect(rows[0].map(group => group.map(part => part.value).join(''))).toEqual(['  ', 'Hello,', '\t', 'WORLD!', '  ']);
    expect(rows[0][1]).toEqual([{ kind: 'blank', value: 'Hello', blankIndex: 0 }, { kind: 'text', value: ',' }]);
  });
  it('preserves authored line breaks and empty rows', () => {
    const rows = buildLyricRows(buildLyricParts('One\n\nTwo\r\nThree\r', ['two']));
    expect(rows.map(row => row.flat().map(part => part.value).join(''))).toEqual(['One', '', 'Two', 'Three', '']);
  });
  it('centers measured lines and clamps before the content start', () => {
    expect(getLyricScrollOffset(300, 100, 400)).toBe(150);
    expect(getLyricScrollOffset(0, 100, 400)).toBe(0);
    expect(getLyricScrollOffset(300, 100, 200)).toBe(250);
  });
  it('returns to the intro after rewinding and handles exact final boundaries', () => {
    const lines = [{ timestamp: 2 }, { timestamp: 5 }, { timestamp: 8 }];
    expect([7.999, 8, 100, 5, 4.999, 0].map(time => getActiveLineIndex(lines, time))).toEqual([1, 2, 2, 1, 0, -1]);
    expect(getActiveLineIndex([], 30)).toBe(-1);
  });
});
