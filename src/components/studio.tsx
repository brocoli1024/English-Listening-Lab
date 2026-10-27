import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

export const palette = { paper: '#F3F0E8', ink: '#24251F', muted: '#65665D', line: '#D2D1C7', orange: '#F65B35', dark: '#1E211D', light: '#F3F0E8', sage: '#DCE2CD' };
export const fonts = { sans: Platform.select({ web: 'Arial, Helvetica, sans-serif', default: 'System' }), serif: Platform.select({ web: 'Georgia, Times New Roman, serif', ios: 'Georgia', default: 'serif' }) };

export function useReducedMotion() {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(value => { if (active) setReduced(value); });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => { active = false; subscription.remove(); };
  }, []);
  return reduced;
}

// Geometric artwork stays crisp at every size, with no remote asset dependency.
export function RecordArt({ variant = 0, style, compact = false }: { variant?: number; style?: StyleProp<ViewStyle>; compact?: boolean }) {
  const [size, setSize] = useState(320);
  const small = size < 280;
  const colors = [palette.orange, '#BFCDB1', '#D2C5E6'];
  return <View onLayout={event => setSize(event.nativeEvent.layout.width)} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden style={[s.art, { backgroundColor: colors[variant % colors.length] }, style]}>
    {!compact && <View style={[s.artTop, small && { top: 12, left: 12, right: 12 }]}><Text style={[s.artLabel, small && { fontSize: 8 }]}>LISTENING LAB®</Text><Text style={[s.artLabel, small && { fontSize: 8 }]}>VOL. 0{variant + 1}</Text></View>}
    <View style={[s.record, { transform: [{ rotate: `${variant * 22 - 16}deg` }] }]}>
      {[91, 83, 75, 67, 59].map(size => <View key={size} style={[s.groove, { width: `${size}%`, height: `${size}%` }]} />)}
      <View style={[s.label, { backgroundColor: colors[variant % colors.length] }]}>{!compact && <Text style={s.recordText}>SIDE A</Text>}<View style={s.spindle} />{!compact && <Text style={s.recordText}>33⅓ RPM</Text>}</View>
    </View>
    {!compact && <View style={[s.artBottom, small && { bottom: 12, left: 12, right: 12 }]}><Text style={[s.artCaption, variant % 3 !== 0 && { color: palette.ink }, small && { fontSize: 20, lineHeight: 22 }]}>{['A little\nwonder.', 'Soft sounds,\nbig discoveries.', 'A familiar\nrefrain.'][variant % 3]}</Text><Text style={[s.star, small && { fontSize: 30, lineHeight: 34 }]}>✳</Text></View>}
  </View>;
}

export function Brand({ dark = false }: { dark?: boolean }) {
  return <View style={s.brand}><View style={s.brandMark}>{[12, 22, 30, 18, 10].map((height, i) => <View key={i} style={{ height, width: 3, backgroundColor: palette.ink, borderRadius: 2 }} />)}</View><Text style={[s.brandText, dark && { color: palette.light }]}>listening<Text style={{ fontWeight: '400' }}> lab.</Text></Text></View>;
}

export function WebPolish() {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const sheet = document.createElement('style');
    sheet.textContent = `body { background: ${palette.paper}; } ::selection { background: #F65B35; color: #24251F; }
      [role="button"], [role="tab"] { transition: background-color .2s ease, opacity .2s ease, box-shadow .2s ease; cursor: pointer; }
      [role="button"]:hover { opacity: .86; }
      [role="button"]:focus-visible, [role="tab"]:focus-visible, input:focus-visible { outline: 3px solid #C84522; outline-offset: 4px; }
      #studio-hero { animation: studio-enter .7s ease-out both; }
      @keyframes studio-enter { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
      @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; } }`;
    document.head.appendChild(sheet);
    return () => sheet.remove();
  }, []);
  return null;
}

const s = StyleSheet.create({
  brand: { flexDirection: 'row', gap: 10, alignItems: 'center' }, brandMark: { width: 40, height: 40, borderRadius: 20, backgroundColor: palette.orange, flexDirection: 'row', gap: 3, justifyContent: 'center', alignItems: 'center' },
  brandText: { fontFamily: fonts.sans, fontSize: 23, fontWeight: '800', letterSpacing: -1, color: palette.ink },
  art: { aspectRatio: 1, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', width: '100%' },
  artTop: { position: 'absolute', top: 20, left: 22, right: 22, flexDirection: 'row', justifyContent: 'space-between', zIndex: 1 }, artLabel: { color: palette.ink, fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  record: { width: '78%', aspectRatio: 1, borderRadius: 999, backgroundColor: '#24251F', alignItems: 'center', justifyContent: 'center' }, groove: { position: 'absolute', borderRadius: 999, borderWidth: 1, borderColor: '#4A4A40' },
  label: { width: '33%', height: '33%', borderRadius: 999, justifyContent: 'center', alignItems: 'center', gap: 8 }, spindle: { width: 10, height: 10, borderRadius: 5, backgroundColor: palette.paper }, recordText: { fontSize: 8, fontWeight: '800', letterSpacing: 1, color: palette.ink },
  artBottom: { position: 'absolute', bottom: 20, left: 22, right: 22, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }, artCaption: { color: palette.paper, fontFamily: fonts.serif, fontSize: 30, fontStyle: 'italic', lineHeight: 31 }, star: { color: palette.ink, fontSize: 48, lineHeight: 52 },
});
