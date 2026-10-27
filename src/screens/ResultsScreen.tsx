import { useRef, useState } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, fonts, palette as p } from '@/components/studio';
import type { RootStackParamList } from '@/navigation/types';
import { saveDraft } from '@/services/progress';
import { exerciseKey } from '@/utils/importLyrics';

type Props = NativeStackScreenProps<RootStackParamList, 'Results'>;
export default function ResultsScreen({ navigation, route }: Props) {
  const { result } = route.params;
  const restartingRef = useRef(false);
  const [restarting, setRestarting] = useState(false);
  const [error, setError] = useState('');
  const restartPractice = async () => {
    if (restartingRef.current) return;
    restartingRef.current = true;
    setRestarting(true);
    setError('');
    try {
      await saveDraft(exerciseKey(result.song), {});
      navigation.replace('Practice', { song: result.song });
    } catch {
      setError('無法開始新的練習，請再試一次。');
      restartingRef.current = false;
      setRestarting(false);
    }
  };
  const message = result.accuracy === 100 ? '太棒了！' : result.accuracy >= 70 ? '做得很好！' : '再聽一次，你會更進步。';
  return <SafeAreaView style={styles.safe}>
    <StatusBar barStyle="dark-content" />
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Brand />
      <Text style={styles.eyebrow}>SESSION COMPLETE / 練習完成</Text>
      <Text style={styles.editorial}>A little closer.</Text>
      <Text style={styles.title}>{message}</Text>
      <Text style={styles.song}>{result.song.title}</Text>
      <View style={styles.score}>
        <Text style={styles.scoreLabel}>YOUR ACCURACY</Text>
        <Text style={styles.accuracy}>{result.accuracy}<Text style={styles.percent}>%</Text></Text>
        <Text style={styles.detail}>答對 {result.correctAnswers} / {result.totalBlanks} 個單字</Text>
      </View>
      <View accessibilityLabel="正確答案" style={styles.answers}>
        <Text style={styles.answersTitle}>The words you heard.</Text><Text style={styles.answerSubtitle}>再看一次，讓每個單字留下印象。</Text>
        {result.song.lyrics.map((line, index) => <View key={`${line.timestamp}-${index}`} style={styles.answerRow}>
          <Text style={styles.lineNumber}>{index + 1}</Text>
          <View style={styles.answerCopy}>
            <Text style={styles.lyric}>{line.english}</Text>
            <Text style={styles.correctWords}>{line.blankedWords.join(' · ')}</Text>
          </View>
        </View>)}
      </View>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <Pressable accessibilityRole="button" disabled={restarting} onPress={() => void restartPractice()} style={[styles.secondary, restarting && styles.disabled]}><Text style={styles.secondaryText}>{restarting ? '準備中…' : '再練一次'}</Text></Pressable>
      <Pressable accessibilityRole="button" disabled={restarting} onPress={() => navigation.popToTop()} style={[styles.primary, restarting && styles.disabled]}><Text style={styles.primaryText}>選擇另一首歌</Text></Pressable>
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: p.paper }, disabled: { opacity: 0.45 }, error: { color: '#A6321A', marginTop: 16 },
  content: { alignItems: 'center', flexGrow: 1, padding: 24, paddingVertical: 40, width: '100%', maxWidth: 760, alignSelf: 'center' },
  eyebrow: { color: p.muted, fontSize: 10, letterSpacing: 2, marginTop: 40, fontWeight: '600' },
  editorial: { color: p.ink, fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 46, letterSpacing: -2, marginTop: 16, textAlign: 'center' },
  title: { color: p.ink, fontSize: 22, fontWeight: '600', marginTop: 12, textAlign: 'center' }, song: { color: p.muted, marginTop: 10, textAlign: 'center', lineHeight: 22 },
  score: { alignItems: 'center', backgroundColor: p.orange, marginTop: 32, padding: 28, width: '100%' },
  scoreLabel: { fontSize: 10, letterSpacing: 2, color: p.ink, fontWeight: '700' },
  accuracy: { color: p.ink, fontFamily: fonts.sans, fontSize: 100, letterSpacing: -6, fontWeight: '700' }, percent: { fontSize: 42, letterSpacing: -2 }, detail: { color: p.ink, marginTop: 6, fontSize: 14 },
  answers: { borderColor: p.line, borderTopWidth: 1, marginTop: 32, paddingTop: 24, width: '100%' },
  answersTitle: { color: p.ink, fontFamily: fonts.serif, fontSize: 29, marginBottom: 8 }, answerSubtitle: { fontSize: 12, color: p.muted, marginBottom: 14 },
  answerRow: { borderBottomColor: p.line, borderBottomWidth: 1, flexDirection: 'row', gap: 16, paddingVertical: 18 },
  lineNumber: { color: p.muted, fontSize: 12, fontWeight: '600', lineHeight: 24, textAlign: 'center', width: 24 }, answerCopy: { flex: 1 },
  lyric: { color: p.ink, fontSize: 17, lineHeight: 26 }, correctWords: { color: '#A83A20', fontSize: 13, fontWeight: '700', marginTop: 8 },
  primary: { backgroundColor: p.ink, borderRadius: 2, marginTop: 12, padding: 18, width: '100%' }, primaryText: { color: p.paper, fontWeight: '700', textAlign: 'center' },
  secondary: { borderColor: p.ink, borderRadius: 2, borderWidth: 1, marginTop: 28, padding: 18, width: '100%' }, secondaryText: { color: p.ink, fontWeight: '700', textAlign: 'center' },
});
