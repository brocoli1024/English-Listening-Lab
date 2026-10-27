import { normaliseAnswer, scoreAnswers } from './answers';

describe('answer scoring', () => {
  it('ignores surrounding whitespace and case', () => {
    expect(normaliseAnswer('  Twinkle ')).toBe('twinkle');
    expect(scoreAnswers(['Twinkle', 'star'], [' twinkle', 'STAR '])).toBe(100);
  });

  it('calculates partial scores', () => {
    expect(scoreAnswers(['wonder', 'high', 'sky'], ['wonder', 'low', ''])).toBe(33);
  });
});
