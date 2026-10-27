export function normaliseAnswer(value: string): string {
  return value.trim().toLowerCase();
}

export function scoreAnswers(expected: string[], answers: string[]): number {
  if (expected.length === 0) return 0;
  const correct = expected.filter((word, index) => normaliseAnswer(word) === normaliseAnswer(answers[index] ?? '')).length;
  return Math.round((correct / expected.length) * 100);
}
