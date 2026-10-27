import { useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Brand, fonts, palette as p, RecordArt, useReducedMotion } from '@/components/studio';
import { Difficulty, dummySongs, type Song } from '@/model/Song';
import { deleteImportedSong, getImportedSongs } from '@/services/importedSongs';
import { difficultyLabels } from '@/utils/importLyrics';
import type { RootStackParamList } from '@/navigation/types';
import { getProgress, type LearningProgress } from '@/services/progress';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;
const filters = ['All', ...Object.values(Difficulty)] as const;
type Filter = (typeof filters)[number];
const filterLabels = { All: '全部歌曲', Easy: '入門 Easy', Medium: '進階 Medium', Hard: '挑戰 Hard' };

export default function HomeScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const mobile = width < 600;
  const reduced = useReducedMotion();
  const scroll = useRef<ScrollView>(null);
  const libraryY = useRef(0);
  const [filter, setFilter] = useState<Filter>('All');
  const [imported, setImported] = useState<Song[]>([]);
  const [libraryError, setLibraryError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const deletionBusy = useRef(false);
  const [libraryNotice, setLibraryNotice] = useState('');
  const [progress, setProgress] = useState<LearningProgress>({ completedSongIds: [], bestAccuracyBySong: {}, totalPractices: 0 });
  useFocusEffect(useCallback(() => {
    let active = true;
    void getProgress().then(value => { if (active) setProgress(value); });
    void getImportedSongs().then(value => { if (active) { setImported(value); setLibraryError(''); } })
      .catch(() => { if (active) setLibraryError('匯入曲庫暫時無法讀取，請重新開啟曲庫再試一次。'); });
    return () => { active = false; };
  }, []));
  const collection = [...dummySongs, ...imported];
  const songs = filter === 'All' ? collection : collection.filter(song => song.difficulty === filter);
  const browse = () => scroll.current?.scrollTo({ y: libraryY.current, animated: !reduced });
  const confirmDelete = async (song: Song) => {
    if (deletionBusy.current) return;
    deletionBusy.current = true;
    setDeleting(true);
    setLibraryError('');
    setLibraryNotice('');
    try {
      await deleteImportedSong(song.id);
      setImported(current => current.filter(item => item.id !== song.id));
      setDeleteTarget(null);
      setLibraryNotice(`已刪除「${song.title}」。`);
    } catch {
      setLibraryError('刪除尚未完成，部分資料可能已清理。請再按一次「確認刪除」完成清理。');
    } finally {
      setProgress(await getProgress());
      setDeleting(false);
      deletionBusy.current = false;
    }
  };
  return <SafeAreaView style={s.safe}>
    <StatusBar barStyle="dark-content" />
    <ScrollView ref={scroll} contentContainerStyle={[s.page, { paddingHorizontal: mobile ? 22 : 48 }]}>
      <View style={s.nav}><Brand />{wide && <Text style={s.navCaption}>A SMALL DAILY PRACTICE. A WORLD OF DIFFERENCE.</Text>}<Pressable accessibilityRole="button" onPress={browse} style={s.navLink}><Text style={s.navLinkText}>{mobile ? '探索 ↗' : '探索曲庫 ↗'}</Text></Pressable></View>
      <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Support')} style={[s.navLink, { alignSelf: 'flex-end' }]}><Text style={s.navLinkText}>說明與支援</Text></Pressable>
      <View nativeID="studio-hero" style={[s.hero, wide && s.heroWide]}>
        <View style={[s.heroCopy, wide && { flex: 1.15 }]}>
          <View style={s.eyebrowRow}><View style={s.dot} /><Text style={s.eyebrow}>TUNE IN. LEARN SOMETHING NEW.</Text></View>
          <Text accessibilityRole="header" style={[s.heading, { fontSize: mobile ? 52 : wide ? 88 : 82, lineHeight: mobile ? 56 : wide ? 87 : 83, letterSpacing: mobile ? -3 : -5 }]}>Less noise.{'\n'}More <Text style={s.italic}>feeling.</Text></Text>
          <Text style={s.chineseHeading}>讓英文，慢慢聽進心裡。</Text>
          <Text style={s.description}>一首熟悉的旋律，一次新的發現。{'\n'}跟著歌聲聆聽、填字，找到學習英文的節奏。</Text>
          <View style={s.heroActions}><Pressable accessibilityRole="button" accessibilityLabel={`開始練習 ${dummySongs[0].title}`} disabled={deleting} onPress={() => navigation.navigate('Setup', { song: dummySongs[0] })} style={({ pressed }) => [s.primary, pressed && { opacity: 0.7 }]}><Text style={s.primaryText}>開始聆聽</Text><Text style={s.primaryArrow}>↗</Text></Pressable><Text style={s.actionNote}>從一首歌開始{'\n'}每一句，都是進步。</Text></View>
          <View style={s.heroFoot}><Text style={s.smallCaps}>LISTEN / FILL / REPEAT</Text><Text style={s.smallCaps}>01 — 03</Text></View>
        </View>
        <View style={[s.heroVisual, wide && { flex: 1 }]}><View style={s.recordFrame}><RecordArt style={s.heroArt} /><View style={s.sticker}><Text style={s.stickerText}>GOOD{'\n'}VIBES,{'\n'}GREAT{'\n'}ENGLISH.</Text></View></View><View style={s.artFooter}><Text style={s.smallCaps}>THE EVERYDAY LISTENING COLLECTION</Text><Text style={s.smallCaps}>EST. 2026</Text></View></View>
      </View>
      <View style={[s.progressBand, mobile && { gap: 24 }]}><View style={s.progressIntro}><Text style={s.eyebrow}>YOUR OWN TEMPO</Text><Text style={s.progressTitle}>每次聆聽，都算數。</Text></View><View style={s.stat}><Text style={s.statNumber}>{String(progress.completedSongIds.length).padStart(2, '0')}</Text><Text style={s.statLabel}>首歌曲已完成</Text></View><View style={s.stat}><Text style={s.statNumber}>{String(progress.totalPractices).padStart(2, '0')}</Text><Text style={s.statLabel}>次專注練習</Text></View>{!mobile && <Text style={s.bandNote}>Small steps.{'\n'}Lasting progress.</Text>}</View>
      <View onLayout={event => { libraryY.current = event.nativeEvent.layout.y; }} style={s.library}>
        <View style={s.sectionTop}><Text style={s.eyebrow}>01 / THE COLLECTION</Text><Text style={s.smallCaps}>{String(collection.length).padStart(2, '0')} TRACKS · 等你探索</Text></View>
        <View style={[s.libraryHeader, !wide && { alignItems: 'flex-start', flexDirection: 'column' }]}><Text accessibilityRole="header" style={[s.libraryTitle, mobile && { fontSize: 42 }]}>Find your <Text style={s.italic}>rhythm.</Text></Text><Text style={s.libraryCaption}>選一首喜歡的，從這裡開始。</Text></View>
        <View accessibilityRole="tablist" style={s.filters}>{filters.map(item => <Pressable key={item} accessibilityRole="tab" accessibilityState={{ selected: item === filter }} onPress={() => setFilter(item)} style={[s.filter, item === filter && s.activeFilter]}><Text style={[s.filterText, item === filter && s.activeFilterText]}>{filterLabels[item]}</Text></Pressable>)}</View>
        <Pressable accessibilityRole="button" disabled={deleting} onPress={() => navigation.navigate('Setup', {})} style={({ pressed }) => [s.importButton, pressed && { opacity: 0.7 }]}><Text style={s.primaryText}>匯入我的歌曲 ↗</Text><Text style={s.importNote}>音檔 + TXT / LRC · 自選難度</Text></Pressable>
        {!!libraryError && <Text accessibilityRole="alert" style={s.libraryError}>{libraryError}</Text>}
        {!!libraryNotice && <Text accessibilityLiveRegion="polite" style={s.description}>{libraryNotice}</Text>}
        <View style={[s.cards, mobile && { flexDirection: 'column' }]}>{songs.map(song => {
          const index = collection.findIndex(item => item.id === song.id);
          return <View key={song.id} style={[s.card, { flexBasis: mobile ? 'auto' : wide ? '31%' : '47%', maxWidth: mobile ? '100%' : wide ? '32%' : '48%' }]}><Pressable disabled={song.audioUnavailable || deleting || deleteTarget === song.id} accessibilityState={{ disabled: song.audioUnavailable || deleting || deleteTarget === song.id }} accessibilityRole="button" accessibilityLabel={`開始練習 ${song.title}`} onPress={() => navigation.navigate('Setup', { song })} style={({ pressed }) => [pressed && { opacity: 0.72 }]}>
            <RecordArt variant={index} /><View style={s.cardMeta}><Text style={s.smallCaps}>{song.imported ? 'MY SONG' : `TRACK 0${index + 1}`}</Text><Text style={s.difficulty}>{difficultyLabels[song.difficulty]} / {song.difficulty.toUpperCase()}</Text></View>
            <View style={s.cardTitleRow}><Text style={s.cardTitle}>{song.title}</Text><View style={s.cardArrow}><Text style={s.cardArrowText}>↗</Text></View></View><Text style={s.artist}>{song.artist}</Text>
            <View style={s.cardBottom}><Text style={s.trackInfo}>{song.audioUnavailable ? '音檔遺失，請重新匯入' : `${song.lyrics.length} 句歌詞 · 可選難度`}</Text><Text style={s.best}>{progress.bestAccuracyBySong[song.id] !== undefined ? `最佳 ${progress.bestAccuracyBySong[song.id]}%` : '開始練習 ↗'}</Text></View>
          </Pressable>
          {song.imported && (deleteTarget === song.id ? <View style={{ gap: 12, paddingVertical: 12 }}>
            <Text accessibilityLiveRegion="polite" style={s.description}>刪除「{song.title}」？音檔、所有難度的草稿及此曲成績會一併移除，無法復原。</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              <Pressable accessibilityRole="button" disabled={deleting} onPress={() => setDeleteTarget(null)} style={s.filter}><Text style={s.filterText}>取消</Text></Pressable>
              <Pressable accessibilityRole="button" accessibilityState={{ disabled: deleting, busy: deleting }} disabled={deleting} onPress={() => { void confirmDelete(song); }} style={[s.filter, s.activeFilter]}><Text style={[s.filterText, s.activeFilterText]}>{deleting ? '正在刪除…' : '確認刪除'}</Text></Pressable>
            </View>
          </View> : <Pressable accessibilityRole="button" accessibilityLabel={`刪除 ${song.title}`} disabled={deleting} onPress={() => { setDeleteTarget(song.id); setLibraryError(''); setLibraryNotice(''); }} style={[s.filter, { alignSelf: 'flex-start', marginBottom: 16 }]}><Text style={s.filterText}>刪除歌曲</Text></Pressable>)}
          </View>;
        })}</View>
        {!songs.length && <View style={s.empty}><Text style={s.emptyTitle}>下一個挑戰，正在路上。</Text><Text style={s.description}>這個難度目前還沒有歌曲，先探索其他旋律吧。</Text><Pressable accessibilityRole="button" onPress={() => setFilter('All')} style={s.filter}><Text style={s.filterText}>查看全部歌曲 ↗</Text></Pressable></View>}
      </View>
      <View style={[s.bottomNote, mobile && { alignItems: 'flex-start' }]}><Text style={[s.noteTitle, mobile && { fontSize: 34 }]}>A little listening.{'\n'}<Text style={s.italic}>A little closer.</Text></Text><Text style={s.noteCopy}>不必一次聽懂全部。{'\n'}留一點時間給自己，讓進步自然發生。</Text></View>
      <View style={s.footer}><Brand /><Text style={s.smallCaps}>用旋律，打開另一個世界。</Text><Text style={s.smallCaps}>LISTENING LAB © 2026</Text></View>
    </ScrollView>
  </SafeAreaView>;
}

const s = StyleSheet.create({
  importButton: { padding: 20, borderWidth: 1, borderColor: p.ink, marginBottom: 24, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, minHeight: 64 }, importNote: { color: p.muted, fontSize: 13 }, libraryError: { color: '#A6321A', fontSize: 14, marginBottom: 16 },
  safe: { flex: 1, backgroundColor: p.paper }, page: { width: '100%', maxWidth: 1440, alignSelf: 'center' },
  nav: { minHeight: 104, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, borderBottomWidth: 1, borderBottomColor: p.line }, navCaption: { fontSize: 10, color: p.muted, letterSpacing: 1.2, maxWidth: 220, lineHeight: 17 }, navLink: { minHeight: 48, justifyContent: 'center' }, navLinkText: { fontSize: 13, fontWeight: '700', color: p.ink },
  hero: { paddingVertical: 56, gap: 40 }, heroWide: { flexDirection: 'row', alignItems: 'center', gap: 56, paddingVertical: 64 }, heroCopy: { minWidth: 0 }, eyebrowRow: { flexDirection: 'row', gap: 9, alignItems: 'center' }, dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: p.orange }, eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.8, color: p.ink },
  heading: { color: p.ink, fontFamily: fonts.sans, fontWeight: '800', letterSpacing: -5, marginTop: 28 }, italic: { fontFamily: fonts.serif, fontStyle: 'italic', fontWeight: '400', letterSpacing: -2 }, chineseHeading: { fontSize: 23, fontWeight: '600', letterSpacing: 2, color: p.ink, marginTop: 28 }, description: { fontSize: 14, lineHeight: 26, color: p.muted, marginTop: 14 },
  heroActions: { flexDirection: 'row', gap: 22, alignItems: 'center', marginTop: 30 }, primary: { backgroundColor: p.orange, borderRadius: 2, minHeight: 58, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', gap: 28 }, primaryText: { fontSize: 14, fontWeight: '700', color: p.ink }, primaryArrow: { fontSize: 25, color: p.ink }, actionNote: { fontSize: 11, lineHeight: 20, color: p.muted }, heroFoot: { borderTopWidth: 1, borderTopColor: p.line, flexDirection: 'row', justifyContent: 'space-between', marginTop: 38, paddingTop: 18 }, smallCaps: { color: p.muted, fontSize: 9, fontWeight: '600', letterSpacing: 1.1 },
  heroVisual: { minWidth: 0, width: '100%', maxWidth: 560, alignSelf: 'center' }, recordFrame: { padding: 16, backgroundColor: '#E7E4DA', position: 'relative' }, heroArt: { transform: [{ rotate: '-4deg' }] }, sticker: { position: 'absolute', right: 0, top: 38, backgroundColor: p.sage, width: 98, height: 98, borderRadius: 49, justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '12deg' }], borderWidth: 1, borderColor: p.ink }, stickerText: { fontWeight: '800', fontSize: 12, lineHeight: 13, color: p.ink, textAlign: 'center' }, artFooter: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 20 },
  progressBand: { paddingVertical: 28, borderTopWidth: 1, borderBottomWidth: 1, borderColor: p.line, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 32 }, progressIntro: { minWidth: 190 }, progressTitle: { color: p.ink, fontSize: 18, marginTop: 10 }, stat: { flexDirection: 'row', gap: 12, alignItems: 'center' }, statNumber: { color: p.ink, fontFamily: fonts.serif, fontSize: 44 }, statLabel: { color: p.muted, fontSize: 12 }, bandNote: { fontFamily: fonts.serif, fontStyle: 'italic', color: p.muted, fontSize: 19, lineHeight: 24 },
  library: { paddingTop: 64, paddingBottom: 64 }, sectionTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 }, libraryHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 18, gap: 16 }, libraryTitle: { fontFamily: fonts.sans, fontSize: 52, fontWeight: '700', color: p.ink, letterSpacing: -2.5 }, libraryCaption: { fontSize: 13, color: p.muted, paddingBottom: 8 }, filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 28, marginBottom: 28 }, filter: { borderWidth: 1, borderColor: p.line, minHeight: 44, paddingHorizontal: 18, justifyContent: 'center', borderRadius: 24 }, activeFilter: { backgroundColor: p.ink, borderColor: p.ink }, filterText: { color: p.muted, fontSize: 12, fontWeight: '600' }, activeFilterText: { color: p.paper },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: 24, alignItems: 'stretch' }, card: { flex: 1, minWidth: 0 }, cardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }, difficulty: { color: p.muted, fontSize: 9, fontWeight: '600', letterSpacing: 0.5 }, cardTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginTop: 12 }, cardTitle: { flex: 1, fontFamily: fonts.sans, fontSize: 24, fontWeight: '700', lineHeight: 28, letterSpacing: -0.8, color: p.ink }, cardArrow: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: p.line, alignItems: 'center', justifyContent: 'center' }, cardArrowText: { color: p.ink, fontSize: 20 }, artist: { color: p.muted, fontSize: 11, lineHeight: 18, marginTop: 10 }, cardBottom: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, borderTopWidth: 1, borderTopColor: p.line, marginTop: 18, paddingTop: 16, paddingBottom: 16 }, trackInfo: { color: p.muted, fontSize: 11 }, best: { color: p.ink, fontSize: 11, fontWeight: '700' },
  empty: { paddingVertical: 40, alignItems: 'flex-start', gap: 16 }, emptyTitle: { fontSize: 22, color: p.ink }, bottomNote: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: p.line, paddingVertical: 42, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 24 }, noteTitle: { fontFamily: fonts.sans, fontSize: 44, color: p.ink, fontWeight: '700', letterSpacing: -1.5 }, noteCopy: { color: p.muted, fontSize: 13, lineHeight: 26 }, footer: { paddingVertical: 32, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 24 },
});
