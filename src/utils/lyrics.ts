export type LyricPart =
  | { kind: 'text'; value: string }
  | { kind: 'blank'; value: string; blankIndex: number };

export function buildLyricParts(english: string, blankedWords: string[], blankTokenIndices?: number[]): LyricPart[] {
  const parts: LyricPart[] = [];
  const used = new Set<number>();
  let cursor = 0;
  let tokenIndex = 0;

  // Match whole words (including contractions), then consume repeated targets
  // from left to right. Slice the original string so no formatting is lost.
  for (const match of english.matchAll(/[\p{L}\p{N}_]+(?:['’][\p{L}\p{N}_]+)*/gu)) {
    const word = match[0];
    const blankIndex = blankTokenIndices ? blankTokenIndices.indexOf(tokenIndex) : blankedWords.findIndex((target, index) =>
      !used.has(index) && target.trim().toLowerCase() === word.toLowerCase());
    tokenIndex++;
    if (blankIndex < 0) continue;
    used.add(blankIndex);
    const wordIndex = match.index;
    if (wordIndex > cursor) {
      parts.push({ kind: 'text', value: english.slice(cursor, wordIndex) });
    }
    parts.push({ kind: 'blank', value: english.slice(wordIndex, wordIndex + word.length), blankIndex });
    cursor = wordIndex + word.length;
  }

  if (cursor < english.length) {
    parts.push({ kind: 'text', value: english.slice(cursor) });
  }
  return parts;
}

export function getActiveLineIndex(lines: { timestamp: number }[], time: number): number {
  return lines.reduce((active, line, index) => line.timestamp <= time ? index : active, -1);
}

// Explicit rows preserve authored newlines. Groups keep punctuation attached to
// an adjacent input, while whitespace remains real text (never a layout gap).
export function buildLyricRows(parts: LyricPart[]): LyricPart[][][] {
  const rows: LyricPart[][][] = [[]];
  let group: LyricPart[] = [];
  const flush = () => {
    if (group.length) rows[rows.length - 1].push(group);
    group = [];
  };
  for (const part of parts) {
    if (part.kind === 'blank') {
      group.push(part);
      continue;
    }
    for (const value of part.value.match(/\r\n|[\r\n]|[^\S\r\n]+|[^\s]+/gu) ?? []) {
      if (/^[\r\n]/u.test(value)) {
        flush();
        rows.push([]);
      } else if (/^\s/u.test(value)) {
        flush();
        rows[rows.length - 1].push([{ kind: 'text', value }]);
      } else {
        group.push({ kind: 'text', value });
      }
    }
  }
  flush();
  return rows;
}

export function getLyricScrollOffset(y: number, height: number, viewportHeight: number): number {
  return Math.max(0, y + height / 2 - viewportHeight / 2);
}
