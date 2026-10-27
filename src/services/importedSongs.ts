import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ImportedAudioAsset } from './importAssets';
import type { Song } from '../model/Song';
import { persistAudio, removeAudio, resolveAudio } from './localFiles';
import { removeSongProgress } from './progress';

const key = '@english-listening/imports-v1';
async function readLibrary(): Promise<Song[]> {
  const raw = await AsyncStorage.getItem(key);
  const value: unknown = raw ? JSON.parse(raw) : [];
  if (!Array.isArray(value) || !value.every(song => song && typeof song.id === 'string' && typeof song.title === 'string'
    && typeof song.audioSource?.uri === 'string' && Array.isArray(song.lyrics))) throw new Error('曲庫資料無法讀取，尚未儲存新歌曲。');
  return value;
}

export async function getImportedSongs(): Promise<Song[]> {
  const songs = await readLibrary();
  return Promise.all(songs.map(async song => {
    try { return { ...song, audioSource: { uri: await resolveAudio(song.id, (song.audioSource as { uri: string }).uri) } }; }
    catch { return { ...song, audioUnavailable: true }; }
  }));
}

let writes = Promise.resolve();
export function deleteImportedSong(id: string): Promise<void> {
  const write = writes.then(async () => {
    const songs = await readLibrary();
    const song = songs.find(item => item.id === id);
    if (!song?.imported) throw new Error('只能刪除已匯入的歌曲。');
    // Keep the entry until all cleanup succeeds so interruption can be retried.
    await removeSongProgress(id);
    await removeAudio(id, (song.audioSource as { uri: string }).uri);
    await AsyncStorage.setItem(key, JSON.stringify(songs.filter(item => item.id !== id)));
  });
  writes = write.then(() => {}, () => {});
  return write;
}
export function saveImportedSong(song: Song, asset: ImportedAudioAsset): Promise<Song> {
  const write = writes.then(async () => {
    const songs = await readLibrary();
    if (songs.some(item => item.id === song.id)) throw new Error('這首歌已匯入。');
    const uri = await persistAudio(song.id, asset);
    try {
      const playableUri = await resolveAudio(song.id, uri);
      await AsyncStorage.setItem(key, JSON.stringify([...songs, { ...song, audioSource: { uri } }]));
      return { ...song, audioSource: { uri: playableUri } };
    }
    catch (error) { await removeAudio(song.id, uri).catch(() => {}); throw error; }
  });
  writes = write.then(() => {}, () => {});
  return write;
}
