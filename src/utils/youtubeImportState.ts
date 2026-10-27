export type ImportStage = 'idle' | 'checking' | 'checked' | 'downloading' | 'converting' | 'subtitles' | 'ready' | 'error';
export type YouTubeImportState = { requestId: number; stage: ImportStage; message: string };
type Event = { type: 'reset'; requestId: number } | { type: 'stage'; requestId: number; stage: ImportStage; message?: string };
export const initialYouTubeState: YouTubeImportState = { requestId: 0, stage: 'idle', message: '' };
export function reduceYouTubeImport(state: YouTubeImportState, event: Event): YouTubeImportState {
  if (event.type === 'reset') return event.requestId > state.requestId ? { ...initialYouTubeState, requestId: event.requestId } : state;
  if (event.requestId !== state.requestId) return state;
  return { ...state, stage: event.stage, message: event.message ?? '' };
}
