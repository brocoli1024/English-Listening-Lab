import { initialYouTubeState, reduceYouTubeImport } from './youtubeImportState';
test('ignore outdated inspection and completion after cancellation', () => {
  let state = reduceYouTubeImport(initialYouTubeState, { type: 'reset', requestId: 2 });
  state = reduceYouTubeImport(state, { type: 'stage', requestId: 2, stage: 'checking' });
  expect(reduceYouTubeImport(state, { type: 'stage', requestId: 1, stage: 'ready' })).toEqual(state);
  state = reduceYouTubeImport(state, { type: 'reset', requestId: 3 });
  expect(reduceYouTubeImport(state, { type: 'stage', requestId: 2, stage: 'ready' }).stage).toBe('idle');
});
