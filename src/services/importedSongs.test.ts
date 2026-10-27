import AsyncStorage from '@react-native-async-storage/async-storage';
import { getImportedSongs, saveImportedSong, deleteImportedSong } from './importedSongs';
import { getDraft, getProgress, saveDraft, saveResult } from './progress';
import { Difficulty, type Song } from '../model/Song';
import { persistAudio, removeAudio, resolveAudio } from './localFiles';
jest.mock('@react-native-async-storage/async-storage', () => jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('./localFiles', () => ({ persistAudio: jest.fn(async () => 'file:///saved/song.mp3'), resolveAudio: jest.fn(async (_id, uri) => uri), removeAudio: jest.fn(async () => {}) }));
const song: Song = { id: 'import-1', title: 'Mine', artist: 'Me', difficulty: Difficulty.Easy, accentColor: '#000', audioSource: { uri: 'temporary' }, imported: true, synced: false, lyrics: [{ timestamp: 0, english: 'Hello world', chinese: '', blankedWords: [] }] };
const asset = { name: 'song.mp3', uri: 'temporary', size: 12, lastModified: 0 };
it('deletes only the selected imported song, its audio, drafts and results', async () => {
  await saveImportedSong(song, asset);
  await saveImportedSong({ ...song, id: 'import-2' }, asset);
  await saveDraft(song.id, { answer: 'legacy' });
  await saveDraft(`${song.id}:rules-1:Easy`, { answer: 'easy' });
  await saveDraft(`${song.id}:rules-1:Hard`, { answer: 'hard' });
  await saveDraft('import-2:rules-1:Easy', { answer: 'keep' });
  await saveResult(song.id, 80, { correctAnswers: 4, totalBlanks: 5, answers: {} });
  await saveResult('import-2', 100, { correctAnswers: 5, totalBlanks: 5, answers: {} });
  await deleteImportedSong(song.id);
  expect((await getImportedSongs()).map(s => s.id)).toEqual(['import-2']);
  expect(await getDraft(song.id)).toEqual({});
  expect(await getDraft(`${song.id}:rules-1:Easy`)).toEqual({});
  expect(await getDraft(`${song.id}:rules-1:Hard`)).toEqual({});
  expect(await getDraft('import-2:rules-1:Easy')).toEqual({ answer: 'keep' });
  expect(await getProgress()).toMatchObject({ completedSongIds: ['import-2'], bestAccuracyBySong: { 'import-2': 100 }, totalPractices: 1 });
  expect(removeAudio).toHaveBeenCalledWith(song.id, 'file:///saved/song.mp3');
});
it('keeps the library entry available for retry after audio deletion fails', async () => {
  await saveImportedSong(song, asset);
  jest.mocked(removeAudio).mockRejectedValueOnce(new Error('locked'));
  await expect(deleteImportedSong(song.id)).rejects.toThrow('locked');
  expect(await getImportedSongs()).toHaveLength(1);
  await deleteImportedSong(song.id);
  expect(await getImportedSongs()).toEqual([]);
});
it('refuses deletion of an ID that is not in the imported library', async () => {
  await expect(deleteImportedSong('builtin')).rejects.toThrow();
  expect(removeAudio).not.toHaveBeenCalled();
});
it('retries a final library-write failure without subtracting results twice', async () => {
  await saveImportedSong(song, asset);
  await saveResult(song.id, 80, { correctAnswers: 4, totalBlanks: 5, answers: {} });
  await saveResult('other', 100, { correctAnswers: 5, totalBlanks: 5, answers: {} });
  const setItem = jest.mocked(AsyncStorage.setItem).getMockImplementation()!;
  jest.mocked(AsyncStorage.setItem)
    .mockImplementationOnce((key, value) => setItem(key, value))
    .mockRejectedValueOnce(new Error('library write failed'));
  await expect(deleteImportedSong(song.id)).rejects.toThrow('library write failed');
  expect(await getImportedSongs()).toHaveLength(1);
  await deleteImportedSong(song.id);
  expect(await getImportedSongs()).toEqual([]);
  expect((await getProgress()).totalPractices).toBe(1);
});
beforeEach(async () => { await AsyncStorage.clear(); jest.clearAllMocks(); });
it('reloads imported songs with durable audio and original lyrics', async () => {
  await saveImportedSong(song, asset);
  expect(await getImportedSongs()).toEqual([{ ...song, audioSource: { uri: 'file:///saved/song.mp3' } }]);
});
it('does not overwrite existing library after a read failure', async () => {
  await saveImportedSong(song, asset);
  jest.mocked(AsyncStorage.getItem).mockRejectedValueOnce(new Error('read failed'));
  await expect(saveImportedSong({ ...song, id: 'import-2' }, asset)).rejects.toThrow();
  expect((await getImportedSongs()).map(s => s.id)).toEqual(['import-1']);
});
it('rolls back audio if metadata cannot be saved', async () => {
  jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error('full'));
  await expect(saveImportedSong(song, asset)).rejects.toThrow('full');
  expect(await getImportedSongs()).toEqual([]);
  expect(removeAudio).toHaveBeenCalledWith('import-1', 'file:///saved/song.mp3');
});
it('does not add a song if copying audio fails', async () => {
  jest.mocked(persistAudio).mockRejectedValueOnce(new Error('copy failed'));
  await expect(saveImportedSong(song, asset)).rejects.toThrow('copy failed');
  expect(await getImportedSongs()).toEqual([]);
});
it('keeps healthy songs accessible when one stored audio file is missing', async () => {
  await saveImportedSong(song, asset);
  await saveImportedSong({ ...song, id: 'import-2' }, asset);
  jest.mocked(resolveAudio).mockRejectedValueOnce(new Error('missing file'));
  const songs = await getImportedSongs();
  expect(songs[0].audioUnavailable).toBe(true);
  expect(songs[1]).toMatchObject({ id: 'import-2', audioSource: { uri: 'file:///saved/song.mp3' } });
});
it('returns the playable saved song without rereading the whole library', async () => {
  expect(await saveImportedSong(song, asset)).toMatchObject({ id: 'import-1', audioSource: { uri: 'file:///saved/song.mp3' } });
});
it('does not commit an import if its audio cannot be resolved', async () => {
  jest.mocked(resolveAudio).mockRejectedValueOnce(new Error('cannot resolve'));
  await expect(saveImportedSong(song, asset)).rejects.toThrow('cannot resolve');
  expect(await getImportedSongs()).toEqual([]);
});
it('retries the same desktop download token after metadata rollback', async () => {
  const download = { kind: 'desktop-download' as const, token: 'temporary-token', jobId: 'job-1', name: 'song.mp3', uri: '', size: 12 };
  jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error('full'));
  await expect(saveImportedSong(song, download)).rejects.toThrow('full');
  expect(removeAudio).toHaveBeenCalledTimes(1);
  await expect(saveImportedSong(song, download)).resolves.toMatchObject({ id: song.id });
  expect(persistAudio).toHaveBeenNthCalledWith(2, song.id, download);
  expect(await getImportedSongs()).toHaveLength(1);
});
