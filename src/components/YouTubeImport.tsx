import { useEffect, useReducer, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { DownloadResult, VideoInfo } from '../../desktop/contracts';
import { getDesktopBridge } from '@/services/desktop';
import { initialYouTubeState, reduceYouTubeImport } from '@/utils/youtubeImportState';
import { palette as p } from './studio';
type Props = { onPrepared: (result: DownloadResult) => void; onReset: () => void; onBusy: (busy: boolean) => void; disabled: boolean };
export default function YouTubeImport({ onPrepared, onReset, onBusy, disabled }: Props) {
  const bridge = getDesktopBridge()!;
  const [url, setUrl] = useState('');
  const [info, setInfo] = useState<VideoInfo | null>(null);
  const [state, dispatch] = useReducer(reduceYouTubeImport, initialYouTubeState);
  const sequence = useRef(0), job = useRef<string | null>(null), working = useRef(false);
  const busy = ['checking', 'downloading', 'converting', 'subtitles'].includes(state.stage);
  useEffect(() => {
    const generation = sequence;
    const unsubscribe = bridge.onYouTubeProgress(event => {
      if (event.jobId !== job.current || !['downloading', 'converting', 'subtitles'].includes(event.stage)) return;
      dispatch({ type: 'stage', requestId: sequence.current, stage: event.stage as 'downloading' | 'converting' | 'subtitles', message: event.percent === undefined ? '' : `${Math.floor(event.percent)}%` });
    });
    return () => {
      generation.current++;
      unsubscribe();
      if (job.current) void bridge.releaseYouTube(job.current).catch(() => {});
      else void bridge.cancelYouTube('inspection').catch(() => {});
    };
  }, [bridge]);
  const reset = async () => {
    const requestId = ++sequence.current;
    dispatch({ type: 'reset', requestId });
    setInfo(null); onReset();
    const old = job.current; job.current = null;
    if (old) await bridge.releaseYouTube(old).catch(() => {});
    else await bridge.cancelYouTube('inspection').catch(() => {});
    if (requestId === sequence.current) { working.current = false; onBusy(false); }
  };
  const inspect = async () => {
    if (working.current) return;
    working.current = true; onBusy(true);
    const requestId = ++sequence.current;
    dispatch({ type: 'reset', requestId });
    dispatch({ type: 'stage', requestId, stage: 'checking' });
    try {
      const result = await bridge.inspectYouTube(url);
      if (requestId !== sequence.current) return;
      setInfo(result); dispatch({ type: 'stage', requestId, stage: 'checked' });
    } catch (error) {
      dispatch({ type: 'stage', requestId, stage: 'error', message: error instanceof Error ? error.message : '無法讀取影片。' });
    } finally { if (requestId === sequence.current) { working.current = false; onBusy(false); } }
  };
  const download = async () => {
    if (!info || working.current) return;
    working.current = true; onBusy(true);
    const requestId = sequence.current;
    dispatch({ type: 'stage', requestId, stage: 'downloading' });
    let started: string | undefined;
    try {
      const result = await bridge.startYouTube(info.videoId); started = result.jobId;
      if (requestId !== sequence.current) { await bridge.releaseYouTube(started); return; }
      job.current = started;
      const prepared = await bridge.waitYouTube(started);
      if (requestId !== sequence.current) return;
      onPrepared(prepared);
      dispatch({ type: 'stage', requestId, stage: 'ready', message: prepared.lrc ? '音檔與英文字幕已準備好。請選擇難度。' : '未找到可用英文字幕，請選擇 TXT 或 LRC 歌詞。' });
    } catch (error) {
      if (started) await bridge.releaseYouTube(started).catch(() => {});
      if (job.current === started) job.current = null;
      dispatch({ type: 'stage', requestId, stage: 'error', message: error instanceof Error ? error.message : '下載失敗，請重試。' });
    } finally { if (requestId === sequence.current) { working.current = false; onBusy(false); } }
  };
  const labels = { checking: '正在檢查影片…', downloading: '正在下載音訊…', converting: '正在轉換音檔…', subtitles: '正在整理英文字幕…' };
  return <View style={s.panel}>
    <Text style={s.label}>YouTube 影片網址</Text>
    <TextInput accessibilityLabel="YouTube 影片網址" value={url} editable={!disabled && !busy && state.stage !== 'ready'} onChangeText={value => { setUrl(value); void reset(); }} autoCapitalize="none" maxLength={2048} placeholder="https://www.youtube.com/watch?v=…" placeholderTextColor={p.muted} style={s.input} />
    <Text style={s.help}>單首公開影片 · 最長 20 分鐘 · 請匯入你有權使用的內容</Text>
    {info && <View><Text style={s.label}>{info.title}</Text><Text style={s.help}>{Math.floor(info.durationSeconds / 60)} 分 {Math.floor(info.durationSeconds % 60)} 秒 · {info.subtitleKind === 'manual' ? '人工英文字幕' : info.subtitleKind === 'automatic' ? '自動字幕，建議校對' : '沒有英文字幕，下載後可補歌詞檔'}</Text></View>}
    {busy && <View style={s.row}><ActivityIndicator color={p.ink} /><Text accessibilityLiveRegion="polite" style={s.help}>{labels[state.stage as keyof typeof labels]} {state.message}</Text></View>}
    {!!state.message && !busy && <Text accessibilityRole={state.stage === 'error' ? 'alert' : undefined} style={[s.help, state.stage === 'error' && s.error]}>{state.message}</Text>}
    <View style={s.row}>
      {!busy && state.stage !== 'ready' && <Pressable accessibilityRole="button" disabled={disabled || !url.trim()} onPress={() => void (info ? download() : inspect())} style={[s.button, (disabled || !url.trim()) && s.disabled]}><Text style={s.buttonText}>{info ? '下載並準備練習' : '檢查影片'}</Text></Pressable>}
      {(busy || info || state.stage === 'error') && <Pressable accessibilityRole="button" disabled={disabled} onPress={() => void reset()} style={s.secondary}><Text style={s.label}>{busy ? '取消' : '重新選擇影片'}</Text></Pressable>}
    </View>
  </View>;
}
const s = StyleSheet.create({
  panel: { gap: 12, padding: 20, borderWidth: 1, borderColor: p.muted, borderRadius: 4 },
  label: { color: p.ink, fontSize: 16, fontWeight: '600' }, input: { color: p.ink, padding: 14, borderWidth: 1, borderColor: p.muted, minHeight: 52, fontSize: 16 },
  help: { color: p.muted, fontSize: 14, lineHeight: 23 }, row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
  button: { minHeight: 48, justifyContent: 'center', padding: 14, backgroundColor: p.ink, borderRadius: 4 }, buttonText: { color: p.paper, fontSize: 16, fontWeight: '600' },
  secondary: { padding: 14, minHeight: 48, justifyContent: 'center' }, disabled: { opacity: 0.45 }, error: { color: '#A6321A' },
});
