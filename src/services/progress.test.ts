import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDraft, getProgress, saveDraft, saveResult } from './progress';
import { Difficulty, dummySongs } from '../model/Song';
import { exerciseKey, prepareExercise } from '../utils/importLyrics';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'));

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

it('persists independent song drafts and keeps the newest edit', async () => {
  await Promise.all([
    saveDraft('first', { '0-0': 'a' }),
    saveDraft('first', { '0-0': 'answer' }),
    saveDraft('second', { '0-0': 'other' }),
  ]);
  expect(await getDraft('first')).toEqual({ '0-0': 'answer' });
  expect(await getDraft('second')).toEqual({ '0-0': 'other' });
});

it('keeps generated difficulty drafts independent from each other and legacy answers', async () => {
  const song = dummySongs[0];
  const easy = exerciseKey(prepareExercise(song, Difficulty.Easy));
  const hard = exerciseKey(prepareExercise(song, Difficulty.Hard));
  await saveDraft(song.id, { '0-0': 'legacy' });
  await saveDraft(easy, { '0-0': 'easy answer' });
  expect(await getDraft(hard)).toEqual({});
  await saveDraft(hard, { '0-0': 'hard answer' });
  await saveDraft(hard, {});
  expect(await getDraft(easy)).toEqual({ '0-0': 'easy answer' });
  expect(await getDraft(song.id)).toEqual({ '0-0': 'legacy' });
});

it('keeps each submitted result and the best score', async () => {
  const detail = { correctAnswers: 2, totalBlanks: 2, answers: { '0-0': 'hello' } };
  await saveResult('song', 100, detail);
  await saveResult('song', 50, { ...detail, correctAnswers: 1 });
  const saved = await getProgress();
  expect(saved.totalPractices).toBe(2);
  expect(saved.completedSongIds).toEqual(['song']);
  expect(saved.bestAccuracyBySong.song).toBe(100);
  expect(saved.history).toHaveLength(2);
  expect(saved.history?.[0]).toMatchObject({ songId: 'song', accuracy: 100, ...detail });
});

it('reports a failed save so submission can be retried', async () => {
  jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error('storage full'));
  await expect(saveResult('song', 0, { correctAnswers: 0, totalBlanks: 1, answers: {} })).rejects.toThrow('storage full');
});


it('preserves history on read failure and allows a successful retry', async () => {
  const detail = { correctAnswers: 1, totalBlanks: 1, answers: { '0-0': 'hello' } };
  await saveResult('first', 100, detail);
  jest.mocked(AsyncStorage.getItem).mockRejectedValueOnce(new Error('read failed'));
  await expect(saveResult('second', 100, detail)).rejects.toThrow('read failed');
  await saveResult('second', 100, detail);
  const progress = await getProgress();
  expect(progress.history?.map(result => result.songId)).toEqual(['first', 'second']);
  expect(progress.totalPractices).toBe(2);
});

it('does not report or persist a failed write as a completed practice', async () => {
  const detail = { correctAnswers: 0, totalBlanks: 1, answers: {} };
  jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error('storage full'));
  await expect(saveResult('song', 0, detail)).rejects.toThrow();
  expect((await getProgress()).totalPractices).toBe(0);
  await saveResult('song', 0, detail);
  expect((await getProgress()).totalPractices).toBe(1);
});
