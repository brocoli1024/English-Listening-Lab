import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import { Brand, fonts, palette as p } from '@/components/studio';
import { Difficulty, type Song } from '@/model/Song';
import type { RootStackParamList } from '@/navigation/types';
import { parseLyrics, prepareExercise, blankRatios, difficultyLabels, type ParsedLyrics } from '@/utils/importLyrics';
import { readLyricFile } from '@/services/localFiles';
import { saveImportedSong } from '@/services/importedSongs';
import { buildLyricParts } from '@/utils/lyrics';
import YouTubeImport from '@/components/YouTubeImport';
import { getDesktopBridge } from '@/services/desktop';
import type { ImportedAudioAsset } from '@/services/importAssets';

type Props = NativeStackScreenProps<RootStackParamList, 'Setup'>;
const errorMessage = (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback;

export default function SetupScreen({ navigation, route }: Props) {
  const existing = route.params?.song;
  const [id] = useState(() => `import-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
  const [title, setTitle] = useState(existing?.title ?? '');
  const [audio, setAudio] = useState<ImportedAudioAsset | null>(null);
  const [sourceMode, setSourceMode] = useState<'files' | 'youtube'>('files');
  const [youtubeBusy, setYoutubeBusy] = useState(false);
  const [lyricName, setLyricName] = useState('');
  const [parsed, setParsed] = useState<ParsedLyrics | null>(null);
  const [difficulty, setDifficulty] = useState(existing?.difficulty ?? Difficulty.Easy);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  const pickSequence = useRef({ audio: 0, lyrics: 0 });
  const pickedUrls = useRef<string[]>([]);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    const urls = pickedUrls.current;
    return () => {
      mounted.current = false;
      if (Platform.OS === 'web') urls.forEach(uri => URL.revokeObjectURL(uri));
    };
  }, []);
  const [savedSong, setSavedSong] = useState<Song | null>(null);
  const fieldsLocked = busy || !!savedSong;
  const candidate = useMemo<Song | null>(() => existing ?? (parsed ? {
    id, title: title.trim(), artist: '我的匯入歌曲', difficulty, accentColor: p.orange,
    audioSource: { uri: audio?.uri ?? '' }, imported: true, ...parsed,
  } : null), [existing, parsed, id, title, difficulty, audio]);
  const exercise = useMemo(() => candidate ? prepareExercise(candidate, difficulty) : null, [candidate, difficulty]);
  const blankCount = exercise?.lyrics.reduce((sum, line) => sum + line.blankedWords.length, 0) ?? 0;
  const canStart = !youtubeBusy && !!exercise && blankCount > 0 && (!!existing || (!!audio && !!title.trim()));
  const resetSource = () => {
    pickSequence.current.audio++; pickSequence.current.lyrics++;
    setAudio(null); setParsed(null); setLyricName(''); setTitle(''); setError('');
  };

  const chooseFile = async (kind: 'audio' | 'lyrics') => {
    const sequence = ++pickSequence.current[kind];
    setError('');
    try {
      // Broad MIME filter allows LRC and audio files with missing provider MIME metadata.
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true, multiple: false, base64: false });
      if (result.canceled || !result.assets.length) return;
      const asset = result.assets[0];
      if (Platform.OS === 'web') {
        if (!mounted.current) URL.revokeObjectURL(asset.uri);
        else pickedUrls.current.push(asset.uri);
      }
      if (!mounted.current || sequence !== pickSequence.current[kind] || saving.current) return;
      if (kind === 'audio') {
        if (!/\.(mp3|m4a|wav|ogg|aac)$/i.test(asset.name)) throw new Error('請選擇 MP3、M4A、WAV、OGG 或 AAC 音檔。');
        if (asset.size === 0 || (asset.size ?? 0) > 50 * 1024 * 1024) throw new Error('請選擇非空白且不超過 50 MB 的音檔。');
        setAudio(asset);
        setTitle(current => current || asset.name.replace(/\.[^.]+$/, ''));
      } else {
        if (!/\.(txt|lrc)$/i.test(asset.name)) throw new Error('請選擇 TXT 或 LRC 歌詞檔。');
        if ((asset.size ?? 0) > 1_000_000) throw new Error('歌詞檔案上限為 1 MB。');
        const next = parseLyrics(await readLyricFile(asset), asset.name);
        if (!mounted.current || sequence !== pickSequence.current[kind] || saving.current) return;
        setParsed(next);
        setLyricName(asset.name);
      }
    } catch (caught) { if (mounted.current) setError(errorMessage(caught, '檔案無法讀取，請重新選擇。')); }
  };

  const start = async () => {
    if (!candidate || !canStart || saving.current) return;
    saving.current = true;
    setBusy(true);
    setError('');
    try {
      let source = existing ?? savedSong;
      if (!source) {
        source = await saveImportedSong(candidate, audio!);
        if (!mounted.current) return;
        setSavedSong(source);
      }
      navigation.replace('Practice', { song: prepareExercise(source, difficulty) });
    } catch (caught) {
      setError(errorMessage(caught, '匯入失敗，請確認裝置儲存空間後重試。'));
      saving.current = false;
      setBusy(false);
    }
  };

  return <SafeAreaView style={s.safe}>
    <ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
      <View style={s.nav}><Pressable accessibilityRole="button" disabled={busy} onPress={() => navigation.goBack()} style={s.back}><Text style={s.text}>‹ 返回曲庫</Text></Pressable><Brand /></View>
      <Text style={s.eyebrow}>{existing ? 'YOUR OWN TEMPO' : 'BRING YOUR OWN SONG'}</Text>
      <Text accessibilityRole="header" style={s.heading}>{existing ? '選擇你的難度。' : '把喜歡的歌，變成練習。'}</Text>
      <Text style={s.description}>{existing ? existing.title : '匯入音檔與英文歌詞，讓每一次聆聽都有新的發現。檔案只保存在這部裝置。'}</Text>
      {!existing && <View style={s.section}>
        <Text accessibilityRole="header" style={s.sectionTitle}>01 / 選擇檔案</Text>
        {!!getDesktopBridge() && <View style={s.options}>{(['files', 'youtube'] as const).map(mode => <Pressable key={mode} accessibilityRole="radio" accessibilityState={{ checked: sourceMode === mode }} disabled={fieldsLocked} onPress={() => { if (sourceMode !== mode) { resetSource(); setYoutubeBusy(false); setSourceMode(mode); } }} style={[s.option, sourceMode === mode && s.selected]}><Text style={[s.fileLabel, sourceMode === mode && s.selectedText]}>{mode === 'files' ? '本機檔案' : 'YouTube 網址'}</Text></Pressable>)}</View>}
        {sourceMode === 'youtube' && <YouTubeImport disabled={fieldsLocked} onReset={resetSource} onBusy={setYoutubeBusy} onPrepared={result => {
          const lyrics = result.lrc ? parseLyrics(result.lrc, 'youtube.lrc') : null;
          setAudio({ kind: 'desktop-download', token: result.audioToken, jobId: result.jobId, name: result.audioName, size: result.audioBytes, uri: '' });
          setTitle(result.title); setParsed(lyrics); setLyricName(result.lrc ? (result.subtitleKind === 'automatic' ? 'YouTube 自動字幕，建議校對' : 'YouTube 英文字幕') : '');
        }} />}
        {sourceMode === 'files' && <Pressable accessibilityRole="button" disabled={fieldsLocked} onPress={() => void chooseFile('audio')} style={({ pressed }) => [s.file, pressed && s.pressed]}>
          <Text style={s.fileLabel}>{audio ? '更換音檔' : '選擇音檔'} <Text style={s.arrow}>↗</Text></Text>
          <Text style={s.description}>{audio?.name ?? 'MP3 / M4A / WAV / OGG / AAC · 上限 50 MB'}</Text>
        </Pressable>}
        <Pressable accessibilityRole="button" disabled={fieldsLocked || youtubeBusy} onPress={() => void chooseFile('lyrics')} style={({ pressed }) => [s.file, pressed && s.pressed]}>
          <Text style={s.fileLabel}>{lyricName ? '更換歌詞檔' : '選擇歌詞檔'} <Text style={s.arrow}>↗</Text></Text>
          <Text style={s.description}>{lyricName || 'UTF-8 的 TXT / LRC · 上限 1 MB'}</Text>
        </Pressable>
        <Text style={s.description}>LRC 可跟隨時間同步；TXT 以手動捲動閱讀。請提供歌詞文字，這裡不會從音檔辨識歌詞。</Text>
        <Text style={s.label}>歌曲名稱</Text>
        <TextInput accessibilityLabel="歌曲名稱" value={title} onChangeText={setTitle} editable={!fieldsLocked} maxLength={120} placeholder="輸入歌曲名稱" placeholderTextColor={p.muted} style={s.input} />
      </View>}
      <View style={s.section}>
        <Text accessibilityRole="header" style={s.sectionTitle}>{existing ? '01' : '02'} / 選擇難度</Text>
        <View accessibilityRole="radiogroup" style={s.options}>{Object.values(Difficulty).map(value => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: difficulty === value, disabled: busy }} disabled={busy} onPress={() => setDifficulty(value)} style={({ pressed }) => [s.option, difficulty === value && s.selected, pressed && s.pressed]}>
          <Text style={[s.fileLabel, difficulty === value && s.selectedText]}>{difficulty === value ? '● ' : '○ '}{difficultyLabels[value]}</Text>
          <Text style={[s.ratio, difficulty === value && s.selectedText]}>約 {blankRatios[value] * 100}% 挖空</Text>
        </Pressable>)}</View>
        <Text style={s.description}>只挖空英文單字，保留標點與縮寫。相同歌曲與難度會得到相同題目；短歌至少 1 題。</Text>
      </View>
      {exercise && <View style={s.preview}>
        <Text accessibilityRole="header" style={s.sectionTitle}>練習預覽</Text>
        <Text accessibilityLiveRegion="polite" style={s.previewCount}>{exercise.lyrics.length} 句歌詞 · {blankCount} 個填空</Text>
        <Text style={s.description}>{exercise.synced === false ? '手動捲動歌詞' : '歌詞隨音樂同步'} · {difficultyLabels[difficulty]}</Text>
        <Text style={s.previewLyric}>{exercise.lyrics.slice(0, 3).map(line => buildLyricParts(line.english, line.blankedWords, line.blankTokenIndices).map(part => part.kind === 'blank' ? '____' : part.value).join('')).join('\n')}</Text>
      </View>}
      {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: !canStart || busy }} disabled={!canStart || busy} onPress={() => void start()} style={({ pressed }) => [s.start, (!canStart || busy) && s.disabled, pressed && s.pressed]}>
        {busy && <ActivityIndicator color={p.paper} />}<Text style={s.startText}>{busy ? '正在儲存歌曲…' : existing ? '開始練習 →' : '儲存並開始練習 →'}</Text>
      </Pressable>
      {!canStart && !existing && <Text style={s.description}>選好音檔、歌詞與歌曲名稱後，就可以開始。</Text>}
    </ScrollView>
  </SafeAreaView>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: p.paper }, page: { width: '100%', maxWidth: 820, alignSelf: 'center', padding: 24, paddingBottom: 48 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, borderBottomWidth: 1, borderColor: p.line, paddingBottom: 16 },
  back: { minHeight: 48, justifyContent: 'center' }, text: { color: p.ink, fontSize: 16 }, eyebrow: { marginTop: 40, color: p.muted, fontSize: 12, letterSpacing: 2 },
  heading: { fontFamily: fonts.sans, fontSize: 34, fontWeight: '700', color: p.ink, marginTop: 16 }, description: { fontSize: 14, lineHeight: 23, color: p.muted, marginTop: 8 },
  section: { marginTop: 32, gap: 12 }, sectionTitle: { color: p.ink, fontSize: 16, fontWeight: '700' }, file: { padding: 20, minHeight: 88, borderWidth: 1, borderColor: p.muted, borderRadius: 4 }, fileLabel: { color: p.ink, fontSize: 17, fontWeight: '600' }, arrow: { fontSize: 22 },
  label: { color: p.ink, fontSize: 15, marginTop: 8 }, input: { borderWidth: 1, borderColor: p.muted, borderRadius: 4, padding: 16, minHeight: 52, fontSize: 16, color: p.ink },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, option: { flexGrow: 1, flexBasis: 180, padding: 20, borderWidth: 1, borderColor: p.muted, borderRadius: 4 }, selected: { backgroundColor: p.ink, borderColor: p.ink }, selectedText: { color: p.paper }, ratio: { color: p.muted, fontSize: 14, marginTop: 8 },
  preview: { marginTop: 32, padding: 24, backgroundColor: '#E7E4DA', borderRadius: 4 }, previewCount: { fontSize: 22, color: p.ink, fontWeight: '600', marginTop: 16 }, previewLyric: { color: p.ink, fontSize: 18, lineHeight: 30, marginTop: 20 },
  start: { marginTop: 24, minHeight: 56, padding: 18, backgroundColor: p.ink, borderRadius: 4, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 }, startText: { color: p.paper, fontSize: 16, fontWeight: '700' }, disabled: { opacity: 0.45 }, pressed: { opacity: 0.7 }, error: { color: '#A6321A', fontSize: 15, lineHeight: 24, marginTop: 24 },
});
