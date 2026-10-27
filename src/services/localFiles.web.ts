import type { DocumentPickerAsset } from 'expo-document-picker';
import { getDesktopBridge } from './desktop';
import { isDesktopDownload, type ImportedAudioAsset } from './importAssets';

const urls = new Map<string, string>();
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('此瀏覽器無法儲存音檔，請使用支援 IndexedDB 的瀏覽器。')); return; }
    const request = indexedDB.open('english-listening-audio', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('audio');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('無法開啟本機音檔儲存空間。'));
    request.onblocked = () => reject(new Error('請關閉其他練習分頁，再重新匯入。'));
  });
}

async function transaction<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = database.transaction('audio', mode);
    const request = operation(tx.objectStore('audio'));
    tx.oncomplete = () => { database.close(); resolve(request.result); };
    tx.onabort = tx.onerror = () => { database.close(); reject(new Error('音檔儲存失敗，請確認瀏覽器儲存空間。')); };
  });
}

export async function readLyricFile(asset: DocumentPickerAsset): Promise<string> {
  if (!asset.file) throw new Error('無法讀取歌詞，請重新選擇。');
  if (asset.file.size > 1_000_000) throw new Error('歌詞檔案上限為 1 MB。');
  return asset.file.text();
}

export async function persistAudio(id: string, asset: ImportedAudioAsset): Promise<string> {
  const desktop = getDesktopBridge();
  if (isDesktopDownload(asset)) {
    if (!desktop) throw new Error('此音檔需在桌面版匯入。');
    return desktop.saveAudio(id, { kind: 'download', token: asset.token });
  }
  if (!asset.file?.size || asset.file.size > 50 * 1024 * 1024) throw new Error('音檔需介於 1 byte 與 50 MB 之間。');
  if (desktop) return desktop.saveAudio(id, { kind: 'bytes', name: asset.name, bytes: new Uint8Array(await asset.file.arrayBuffer()) });
  await transaction('readwrite', store => store.put(asset.file!, id));
  return `indexeddb:${id}`;
}

export async function resolveAudio(id: string, _uri: string): Promise<string> {
  const desktop = getDesktopBridge();
  if (desktop) return desktop.resolveAudio(id);
  const existing = urls.get(id);
  if (existing) return existing;
  const blob: unknown = await transaction('readonly', store => store.get(id));
  if (!(blob instanceof Blob)) throw new Error('找不到已匯入音檔，請重新匯入。');
  const url = URL.createObjectURL(blob);
  urls.set(id, url);
  return url;
}

export async function removeAudio(id: string, _uri: string): Promise<void> {
  const desktop = getDesktopBridge();
  if (desktop) return desktop.removeAudio(id);
  await transaction('readwrite', store => store.delete(id));
  const url = urls.get(id);
  if (url) URL.revokeObjectURL(url);
  urls.delete(id);
}
