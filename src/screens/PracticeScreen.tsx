import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StatusBar, StyleSheet, Text, TextInput, useWindowDimensions, View,
  type LayoutChangeEvent,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand, RecordArt, useReducedMotion, palette, fonts } from '@/components/studio';
import { dummySongs } from '@/model/Song';
import type { RootStackParamList } from '@/navigation/types';
import { getDraft, saveDraft, saveResult } from '@/services/progress';
import { normaliseAnswer, scoreAnswers } from '@/utils/answers';
import { buildLyricParts, buildLyricRows, getActiveLineIndex, getLyricScrollOffset } from '@/utils/lyrics';
import { exerciseKey } from '@/utils/importLyrics';

type Props = NativeStackScreenProps<RootStackParamList, 'Practice'>;
const formatTime = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

function FocusLine({ distance, editing, children, onLayout }: {
  distance: number; editing: boolean; children: ReactNode; onLayout: (event: LayoutChangeEvent) => void;
}) {
  const reduced = useReducedMotion();
  const [opacity] = useState(() => new Animated.Value(0.5));
  const [scale] = useState(() => new Animated.Value(0.88));
  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(opacity, { toValue: editing || distance === 0 ? 1 : distance === 1 ? 0.62 : distance === 2 ? 0.36 : 0.22, duration: reduced ? 0 : 360, useNativeDriver: true }),
      Animated.timing(scale, { toValue: editing || distance === 0 ? 1 : 0.88, duration: reduced ? 0 : 360, useNativeDriver: true }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [distance, editing, opacity, scale, reduced]);
  // Reserve the enlarged layout so animation never moves an input or changes wrapping.
  return <View onLayout={onLayout} style={styles.lyricLine}>
    <Animated.View style={{ opacity, transform: [{ scale }], transformOrigin: 'left center' }}>
      {children}
    </Animated.View>
  </View>;
}

export default function PracticeScreen(props: Props) {
  // A route can receive a different song without unmounting. Isolate player,
  // measurements, and in-flight draft reads by song as well as storage key.
  return <SongPractice key={exerciseKey(props.route.params.song)} {...props} />;
}

function SongPractice({ navigation, route }: Props) {
  const { song } = route.params;
  const draftId = exerciseKey(song);
  const reduced = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const wide = width >= 850 || (width >= 700 && width > height);
  const player = useAudioPlayer(song.audioSource, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const answersRef = useRef(answers);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingLine, setEditingLine] = useState<number | null>(null);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [webKeyboardInset, setWebKeyboardInset] = useState(0);
  const submittingRef = useRef(false);
  const scrollRef = useRef<ScrollView>(null);
  const viewportRef = useRef<View>(null);
  const focusedInput = useRef<TextInput | null>(null);
  const inputRefs = useRef<Record<string, TextInput | null>>({});
  const keyboardTop = useRef(Number.POSITIVE_INFINITY);
  const scrollY = useRef(0);
  const dragging = useRef(false);
  const lineLayouts = useRef<Record<number, { y: number; height: number }>>({});
  const lastFollow = useRef({ target: -1, at: 0 });
  const trackWidth = useRef(1);

  const lyricParts = useMemo(() => song.lyrics.map((line) =>
    buildLyricParts(line.english, line.blankedWords, line.blankTokenIndices)), [song.lyrics]);
  const lyricRows = useMemo(() => lyricParts.map(buildLyricRows), [lyricParts]);
  const blanks = useMemo(() => lyricParts.flatMap((parts, lineIndex) =>
    parts.flatMap((part) => part.kind === 'blank'
      ? [{ id: `${lineIndex}-${part.blankIndex}`, word: part.value }] : [])), [lyricParts]);
  const activeLineIndex = song.synced === false ? -1 : getActiveLineIndex(song.lyrics, status.currentTime);

  const revealInput = useCallback(() => {
    requestAnimationFrame(() => {
      const input = focusedInput.current;
      input?.measureInWindow((_x, y, _width, height) => {
        viewportRef.current?.measureInWindow((_sx, top, _sw, visibleHeight) => {
          if (focusedInput.current !== input) return;
          const bottom = Math.min(top + visibleHeight, keyboardTop.current) - 18;
          const delta = y < top + 18 ? y - top - 18 : Math.max(0, y + height - bottom);
          if (delta) scrollRef.current?.scrollTo({ y: Math.max(0, scrollY.current + delta), animated: !reduced });
        });
      });
    });
  }, [reduced]);

  const followLyric = useCallback((force = false) => {
    if (focusedInput.current || dragging.current || viewportHeight <= 0) return;
    const layout = lineLayouts.current[activeLineIndex];
    if (!layout) return; // No highlight or scroll to the first line during the intro.
    // Position-only changes do not emit onLayout on Web (e.g. viewport padding
    // or an earlier answer wrapping). Derive y from measured row heights.
    let y = viewportHeight / 2;
    for (let index = 0; index < activeLineIndex; index++) {
      const preceding = lineLayouts.current[index];
      if (!preceding) return;
      y += preceding.height;
    }
    const target = getLyricScrollOffset(y, layout.height, viewportHeight);
    const previous = lastFollow.current;
    // Also recover from manual scroll on the next audio update, but do not
    // restart an in-flight smooth scroll every 250 ms.
    if (!force && previous.target === target &&
      (Date.now() - previous.at < 650 || Math.abs(scrollY.current - target) < 8)) return;
    lastFollow.current = { target, at: Date.now() };
    scrollRef.current?.scrollTo({ y: target, animated: !reduced });
  }, [activeLineIndex, viewportHeight, reduced]);

  useEffect(() => { followLyric(); }, [followLyric, status.currentTime, editingLine]);
  useEffect(() => {
    // Mobile browsers can resize only the visual viewport when the keyboard
    // opens. React Native's window dimensions alone do not reflect that inset.
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const viewport = window.visualViewport;
    if (!viewport) return;
    const resize = () => {
      keyboardTop.current = viewport.offsetTop + viewport.height;
      setWebKeyboardInset(Math.max(0, window.innerHeight - keyboardTop.current));
      revealInput();
    };
    viewport.addEventListener('resize', resize);
    viewport.addEventListener('scroll', resize);
    return () => {
      viewport.removeEventListener('resize', resize);
      viewport.removeEventListener('scroll', resize);
    };
  }, [revealInput]);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (event) => {
      keyboardTop.current = event.endCoordinates.screenY;
      revealInput();
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      keyboardTop.current = Number.POSITIVE_INFINITY;
      revealInput();
    });
    return () => { show.remove(); hide.remove(); };
  }, [revealInput]);

  useEffect(() => {
    let cancelled = false;
    getDraft(draftId).then((draft) => {
      if (!cancelled) { answersRef.current = draft; setAnswers(draft); }
    }).catch(() => {
      if (!cancelled) setError('無法讀取先前答案，仍可繼續練習。');
    }).finally(() => { if (!cancelled) setReady(true); });
    return () => { cancelled = true; };
  }, [draftId]);

  const updateAnswer = (id: string, value: string) => {
    const next = { ...answersRef.current, [id]: value };
    answersRef.current = next;
    setAnswers(next);
    void saveDraft(draftId, next).catch(() => setError('答案尚未儲存，請確認裝置儲存空間。'));
    revealInput();
  };
  const progress = status.duration > 0 ? Math.min(100, status.currentTime / status.duration * 100) : 0;
  const answeredCount = blanks.filter(({ id }) => answers[id]?.trim()).length;
  const seekTo = async (time: number) => {
    try { await player.seekTo(Math.max(0, Math.min(status.duration, time))); }
    catch { setError('無法調整播放位置，請再試一次。'); }
  };
  const togglePlayback = async () => {
    try {
      if (status.playing) { player.pause(); return; }
      if (status.didJustFinish || (status.duration > 0 && status.currentTime >= status.duration - 0.05)) await player.seekTo(0);
      player.play();
    } catch { setError('無法播放歌曲，請再試一次。'); }
  };
  const finishEditing = () => {
    focusedInput.current?.blur();
    focusedInput.current = null;
    setEditingLine(null);
    Keyboard.dismiss();
    followLyric(true);
  };
  const submit = async () => {
    if (!ready || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError('');
    const expected = blanks.map(({ word }) => word);
    const entered = blanks.map(({ id }) => answersRef.current[id] ?? '');
    const accuracy = scoreAnswers(expected, entered);
    const correctAnswers = expected.filter((word, index) => normaliseAnswer(word) === normaliseAnswer(entered[index])).length;
    try {
      player.pause();
      await saveDraft(draftId, answersRef.current);
      await saveResult(song.id, accuracy, { correctAnswers, totalBlanks: blanks.length, answers: answersRef.current });
      navigation.replace('Results', { result: { song, correctAnswers, totalBlanks: blanks.length, accuracy } });
    } catch {
      setError('練習紀錄儲存失敗，請再次提交答案。');
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const fontSize = wide ? 34 : 27;
  return <SafeAreaView style={styles.safeArea}>
    <StatusBar barStyle="light-content" />
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}
      keyboardVerticalOffset={insets.top} style={[styles.flex, { paddingBottom: webKeyboardInset }]}>
      <View style={styles.topBar}>
        <Pressable accessibilityLabel="返回歌曲列表" accessibilityRole="button" onPress={() => navigation.goBack()} hitSlop={10} style={({ pressed }) => ({ minHeight: 44, justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
          <Text style={styles.back}>‹ 返回</Text>
        </Pressable>
        <Brand dark />
      </View>
      <View style={[styles.body, wide && styles.wideBody]}>
        <ScrollView style={wide ? styles.playerColumn : styles.compactPlayer} contentContainerStyle={[styles.playerContent, wide && styles.widePlayerContent]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={[styles.songInfo, wide && styles.wideSongInfo]}>
            <RecordArt variant={Math.max(0, dummySongs.findIndex(item => item.id === song.id))} compact={!wide} style={[styles.artwork, wide && styles.wideArtwork, wide && { maxWidth: Math.min(440, height * 0.48) }]} />
            <View style={styles.songCopy}>
              <Text style={[styles.title, wide && styles.wideTitle]}>{song.title}</Text>
              <Text style={styles.artist}>{song.artist}</Text>
              {wide && <Text style={styles.songMeta}>{song.difficulty} · 英文歌曲聽力</Text>}
            </View>
          </View>
          <View style={styles.playerPanel}>
            <View accessibilityRole="adjustable" accessibilityLabel="歌曲播放進度"
              accessibilityValue={{ min: 0, max: Math.round(status.duration), now: Math.round(status.currentTime), text: `${formatTime(status.currentTime)} / ${formatTime(status.duration)}` }}
              accessibilityActions={[{ name: 'increment', label: '快轉五秒' }, { name: 'decrement', label: '倒退五秒' }]}
              onAccessibilityAction={(event) => void seekTo(status.currentTime + (event.nativeEvent.actionName === 'increment' ? 5 : -5))}
              onLayout={(event) => { trackWidth.current = event.nativeEvent.layout.width; }}
              onStartShouldSetResponder={() => status.duration > 0}
              onResponderRelease={(event) => void seekTo(event.nativeEvent.locationX / trackWidth.current * status.duration)} style={styles.progressTouch}>
              <View pointerEvents="none" style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress}%` }]} /></View>
            </View>
            <View style={styles.times}><Text style={styles.time}>{formatTime(status.currentTime)}</Text><Text style={styles.time}>{formatTime(status.duration)}</Text></View>
            <View style={styles.controls}>
              <Pressable accessibilityLabel="倒退五秒" accessibilityRole="button" onPress={() => void seekTo(status.currentTime - 5)} style={styles.skipButton}><Text style={styles.skipText}>↶ 5</Text></Pressable>
              <Pressable accessibilityLabel={status.playing ? '暫停歌曲' : '播放歌曲'} accessibilityRole="button" onPress={() => void togglePlayback()} style={styles.playButton}><Text style={styles.playText}>{status.playing ? 'Ⅱ' : '▶'}</Text></Pressable>
              <Pressable accessibilityLabel="快轉五秒" accessibilityRole="button" onPress={() => void seekTo(status.currentTime + 5)} style={styles.skipButton}><Text style={styles.skipText}>5 ↷</Text></Pressable>
            </View>
            {status.error ? <Text accessibilityRole="alert" style={styles.error}>歌曲載入失敗，請重新開啟練習頁。</Text> : null}
          </View>
        </ScrollView>
        <View style={styles.lyricsColumn}>
          <View style={styles.lyricsHeader}>
            <View style={styles.flex}><Text style={styles.eyebrow}>歌詞 · LISTEN & FILL</Text><Text style={styles.help}>{song.synced === false ? '手動捲動歌詞，在底線填入你聽到的字' : editingLine !== null ? '輸入中 · 歌詞追蹤已暫停' : '跟著歌聲，在底線填入你聽到的字'}</Text></View>
            {editingLine !== null && <Pressable accessibilityRole="button" onPress={finishEditing} style={styles.done}><Text style={styles.doneText}>完成輸入</Text></Pressable>}
          </View>
          <View ref={viewportRef} style={styles.viewport} onLayout={(event) => { setViewportHeight(event.nativeEvent.layout.height); revealInput(); }}>
            <ScrollView ref={scrollRef} style={styles.flex}
              contentContainerStyle={{ paddingHorizontal: wide ? 28 : 8, paddingVertical: song.synced === false ? 16 : viewportHeight / 2 }}
              onContentSizeChange={() => { if (focusedInput.current) revealInput(); else followLyric(); }}
              onScroll={(event) => { scrollY.current = event.nativeEvent.contentOffset.y; }} scrollEventThrottle={16}
              onScrollBeginDrag={() => { dragging.current = true; }}
              onScrollEndDrag={() => { dragging.current = false; lastFollow.current.at = 0; }}
              onMomentumScrollEnd={() => { dragging.current = false; }}
              keyboardDismissMode="none" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {song.lyrics.map((line, lineIndex) => <FocusLine key={`${line.timestamp}-${lineIndex}`}
                distance={song.synced === false ? 0 : activeLineIndex < 0 ? 1 : Math.abs(lineIndex - activeLineIndex)} editing={editingLine === lineIndex}
                onLayout={(event) => { lineLayouts.current[lineIndex] = event.nativeEvent.layout; if (lineIndex <= activeLineIndex) followLyric(); }}>
                {lyricRows[lineIndex].map((groups, rowIndex) => <View key={rowIndex} style={[styles.inlineLyric, { minHeight: fontSize * 1.5 }]}>
                  {groups.map((parts, groupIndex) => <View key={groupIndex} style={styles.wordGroup}>
                    {parts.map((part, partIndex) => {
                      if (part.kind === 'text') return <Text key={partIndex} style={[styles.lyricText, { fontSize, lineHeight: fontSize * 1.5 }]}>{part.value}</Text>;
                      const id = `${lineIndex}-${part.blankIndex}`;
                      return <TextInput key={id} ref={(input) => { inputRefs.current[id] = input; }}
                        accessibilityLabel={`第 ${lineIndex + 1} 行第 ${part.blankIndex + 1} 個答案`}
                        autoCapitalize="none" autoCorrect={false} editable={ready && !submitting}
                        onFocus={() => {
                          focusedInput.current = inputRefs.current[id];
                          setEditingLine(lineIndex);
                          scrollRef.current?.scrollTo({ y: scrollY.current, animated: false });
                          revealInput();
                        }}
                        onBlur={() => { if (focusedInput.current === inputRefs.current[id]) { focusedInput.current = null; setEditingLine(null); } }}
                        onChangeText={(value) => updateAnswer(id, value)} onSubmitEditing={finishEditing} returnKeyType="done"
                        selectionColor="#FFB79E" underlineColorAndroid="transparent"
                        style={[styles.inlineInput, { fontSize, height: fontSize * 1.5, width: Math.max(54, Math.max(part.value.length, answers[id]?.length ?? 0) * fontSize * 0.64 + 8) }]}
                        value={answers[id] ?? ''} />;
                    })}
                  </View>)}
                </View>)}
                <Text style={[styles.translation, (lineIndex === activeLineIndex || editingLine === lineIndex) && styles.activeTranslation]}>{line.chinese}</Text>
              </FocusLine>)}
            </ScrollView>
          </View>
          <View style={styles.footer}>
            {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
            <View style={styles.footerActions}>
              <View><Text style={styles.counter}>{answeredCount} / {blanks.length}</Text><Text style={styles.help}>已回答</Text></View>
              <Pressable accessibilityRole="button" disabled={!ready || submitting} onPress={() => void submit()} style={[styles.submit, (!ready || submitting) && styles.disabled]}>
                <Text style={styles.submitText}>{submitting ? '儲存中…' : '提交答案 →'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  flex: { flex: 1, minHeight: 0 }, safeArea: { flex: 1, backgroundColor: palette.dark },
  topBar: { paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#3C4036', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { color: '#D1D5DF', fontSize: 16 }, eyebrow: { color: '#B9BDB1', fontSize: 11, fontWeight: '700', letterSpacing: 1.8 },
  body: { flex: 1, minHeight: 0, paddingHorizontal: 16 }, wideBody: { flexDirection: 'row', paddingHorizontal: 40, paddingTop: 24, gap: 48, maxWidth: 1440, width: '100%', alignSelf: 'center' },
  playerColumn: { flex: 0.85, minWidth: 0 }, compactPlayer: { flexGrow: 0, flexShrink: 1, maxHeight: '43%' },
  playerContent: { paddingVertical: 8 }, widePlayerContent: { flexGrow: 1, justifyContent: 'center', padding: 16 },
  songInfo: { flexDirection: 'row', alignItems: 'center', gap: 14 }, wideSongInfo: { flexDirection: 'column', alignItems: 'stretch', gap: 24 },
  artwork: { width: 50, height: 50, borderRadius: 2, alignItems: 'center', justifyContent: 'center' },
  wideArtwork: { width: '100%', height: 'auto', aspectRatio: 1, maxWidth: 440, alignSelf: 'center', borderRadius: 2 },
  note: { color: '#FFF', fontSize: 28 }, wideNote: { fontSize: 132 }, songCopy: { flexShrink: 1 },
  title: { color: '#F8F9FC', fontSize: 17, fontWeight: '800' }, wideTitle: { fontSize: 34, fontFamily: fonts.serif, fontWeight: '400' },
  artist: { color: '#B9BDB1', fontSize: 12, marginTop: 5 }, songMeta: { color: '#B9BDB1', fontSize: 12, marginTop: 12 },
  playerPanel: { paddingTop: 4 }, progressTouch: { height: 24, justifyContent: 'center' },
  progressTrack: { height: 4, backgroundColor: '#353945', borderRadius: 3, overflow: 'hidden' }, progressFill: { height: '100%', backgroundColor: palette.orange },
  times: { flexDirection: 'row', justifyContent: 'space-between' }, time: { color: '#929BAE', fontSize: 11, fontVariant: ['tabular-nums'] },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 28, paddingVertical: 8 },
  skipButton: { width: 52, height: 44, justifyContent: 'center', alignItems: 'center' }, skipText: { color: '#C6CDDB', fontSize: 20, fontWeight: '600' },
  playButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: palette.orange, justifyContent: 'center', alignItems: 'center' }, playText: { color: '#11151F', fontSize: 22 },
  lyricsColumn: { flex: 1.2, minWidth: 0, minHeight: 0 }, lyricsHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8, gap: 12 },
  help: { color: '#B9BDB1', fontSize: 11, marginTop: 5 }, done: { padding: 10, borderRadius: 12, backgroundColor: '#262C3A' }, doneText: { color: '#E0E5F3', fontSize: 12 },
  viewport: { flex: 1, minHeight: 0, overflow: 'hidden' }, lyricLine: { paddingVertical: 25, paddingHorizontal: 8 },
  inlineLyric: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }, wordGroup: { flexDirection: 'row', alignItems: 'center', maxWidth: '100%', flexShrink: 1 },
  lyricText: { color: '#F5F6FC', fontWeight: '700', flexShrink: 1, ...(Platform.OS === 'web' ? { whiteSpace: 'pre-wrap' as const } : {}) },
  inlineInput: { color: '#FFB79E', borderBottomWidth: 2, borderBottomColor: '#F98D68', paddingHorizontal: 2, paddingVertical: 0, fontWeight: '700', textAlign: 'center', maxWidth: '100%', flexShrink: 1 },
  translation: { color: '#B8C0D0', fontSize: 15, lineHeight: 24, marginTop: 12 }, activeTranslation: { color: '#E5E9F3' },
  footer: { borderTopWidth: 1, borderTopColor: '#252A35', paddingVertical: 12, paddingHorizontal: 8 }, footerActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  counter: { color: '#E6EAF4', fontSize: 19, fontWeight: '700', fontVariant: ['tabular-nums'] },
  submit: { backgroundColor: palette.orange, borderRadius: 3, paddingHorizontal: 26, paddingVertical: 14 }, submitText: { color: '#171D2D', fontWeight: '800', fontSize: 14 },
  disabled: { opacity: 0.45 }, error: { color: '#FDA4AF', fontSize: 12, marginBottom: 8 },
});
