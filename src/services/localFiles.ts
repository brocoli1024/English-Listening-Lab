import { Directory, File, Paths } from 'expo-file-system';
import type { DocumentPickerAsset } from 'expo-document-picker';
import { isDesktopDownload, type ImportedAudioAsset } from './importAssets';

export async function readLyricFile(asset: DocumentPickerAsset): Promise<string> {
  const file = new File(asset.uri);
  if (file.size > 1_000_000) throw new Error('歌詞檔案上限為 1 MB。');
  return file.text();
}

export async function persistAudio(id: string, asset: ImportedAudioAsset): Promise<string> {
  if (isDesktopDownload(asset)) throw new Error('此音檔需在桌面版匯入。');
  const source = new File(asset.uri);
  if (!source.size || source.size > 50 * 1024 * 1024) throw new Error('音檔需介於 1 byte 與 50 MB 之間。');
  const directory = new Directory(Paths.document, 'imported-audio');
  directory.create({ idempotent: true, intermediates: true });
  const extension = asset.name.split('.').pop()!.toLowerCase();
  const destination = new File(directory, `${id}.${extension}`);
  try { await source.copy(destination); }
  catch (error) { if (destination.exists) destination.delete(); throw error; }
  return destination.uri;
}

export async function resolveAudio(_id: string, uri: string): Promise<string> {
  // Rebuild against the current document directory (iOS container paths can change).
  const file = new File(Paths.document, 'imported-audio', uri.split('/').pop()!);
  if (!file.exists) throw new Error('找不到已匯入音檔，請重新匯入。');
  return file.uri;
}

export async function removeAudio(_id: string, uri: string): Promise<void> {
  const file = new File(uri);
  if (file.exists) file.delete();
}
