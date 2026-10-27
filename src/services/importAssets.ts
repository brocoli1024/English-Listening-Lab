import type { DocumentPickerAsset } from 'expo-document-picker';
export type DesktopDownloadAsset = { kind: 'desktop-download'; token: string; jobId: string; name: string; size: number; uri: string };
export type ImportedAudioAsset = DocumentPickerAsset | DesktopDownloadAsset;
export function isDesktopDownload(asset: ImportedAudioAsset): asset is DesktopDownloadAsset {
  return 'kind' in asset && asset.kind === 'desktop-download';
}
