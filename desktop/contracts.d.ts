export type SubtitleKind = 'manual' | 'automatic' | 'none';
export type VideoInfo = { videoId: string; title: string; durationSeconds: number; subtitleKind: SubtitleKind; subtitleLanguage: string | null };
export type JobEvent = { jobId: string; stage: 'checking' | 'downloading' | 'converting' | 'subtitles' | 'ready' | 'cancelled' | 'failed'; percent?: number; message?: string };
export type DownloadResult = { jobId: string; audioToken: string; audioName: string; audioBytes: number; title: string; lrc: string | null; subtitleKind: SubtitleKind };
export type AudioInput = { kind: 'bytes'; name: string; bytes: Uint8Array } | { kind: 'download'; token: string };
export interface DesktopBridge {
  openProjectPage(page: 'downloads' | 'issues' | 'privacy'): Promise<void>;
  inspectYouTube(url: string): Promise<VideoInfo>;
  startYouTube(videoId: string): Promise<{jobId: string}>;
  waitYouTube(jobId: string): Promise<DownloadResult>;
  /** The reserved ID 'inspection' cancels only this window's pending metadata check. */
  cancelYouTube(jobId: string): Promise<void>;
  releaseYouTube(jobId: string): Promise<void>;
  onYouTubeProgress(listener: (event: JobEvent) => void): () => void;
  saveAudio(songId: string, input: AudioInput): Promise<string>;
  resolveAudio(songId: string): Promise<string>;
  removeAudio(songId: string): Promise<void>;
}
