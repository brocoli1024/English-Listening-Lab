import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { palette as p } from '@/components/studio';
import content from '@/generated/support-content.json';
import { openProjectPage, type ProjectPage } from '@/services/projectPages';

export default function SupportScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Support'>) {
  const [notice, setNotice] = useState<'app' | 'thirdParty' | 'microsoft' | null>(null);
  const [linkError, setLinkError] = useState('');
  const openPage = async (page: ProjectPage) => {
    setLinkError('');
    try { await openProjectPage(page); }
    catch { setLinkError('無法開啟瀏覽器。請手動前往 github.com/brocoli1024/English-Listening-Lab。'); }
  };
  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.page}>
    <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} style={s.button}><Text style={s.buttonText}>返回首頁</Text></Pressable>
    <Text accessibilityRole="header" style={s.title}>說明與支援</Text>
    <Text selectable style={s.body}>English Listening Lab · 版本 {content.version}</Text>
    {!!linkError && <Text accessibilityRole="alert" style={s.body}>{linkError}</Text>}
    <View style={s.section}><Text accessibilityRole="header" style={s.heading}>更新</Text>
      <Text style={s.body}>版本與下載公告集中在 GitHub。本程式不會自動更新；安裝新版前先完成備份，新版會沿用原本資料目錄。正式發布前，下載頁可能尚無安裝檔。</Text>
      <Pressable accessibilityRole="button" onPress={() => void openPage('downloads')} style={s.button}><Text style={s.buttonText}>查看下載與版本紀錄（瀏覽器）</Text></Pressable>
    </View>
    <View style={s.section}><Text accessibilityRole="header" style={s.heading}>問題回報</Text>
      <Text selectable style={s.body}>請提供版本 {content.version}、Windows 版本、重現步驟、預期結果及實際錯誤文字。GitHub 回報需要登入帳號；你填寫並送出後，內容才會交給專案維護者。</Text>
      <Pressable accessibilityRole="button" onPress={() => void openPage('issues')} style={s.button}><Text style={s.buttonText}>回報問題（瀏覽器）</Text></Pressable>
      <Text style={s.body}>截圖前遮住私人資訊；不要附上整個資料夾、私人音檔、歌詞或帳號憑證。YouTube 匯入失敗時，可先改用自己的音檔搭配 TXT／LRC。</Text>
    </View>
    <View style={s.section}><Text accessibilityRole="header" style={s.heading}>資料與隱私</Text>
      <Text style={s.body}>歌曲、音檔、答案草稿與成績儲存在這台電腦。本程式沒有帳號、廣告、使用分析或自動回報功能；不會自動把你的曲庫送給開發者。</Text>
      <Text style={s.body}>YouTube 匯入需要連線至 YouTube 及其媒體服務；對方會依其政策處理網路請求。開啟 GitHub 頁面會交由瀏覽器連線。請只匯入已取得內容權利及適用平台許可的資料。</Text>
      <Pressable accessibilityRole="button" onPress={() => void openPage('privacy')} style={s.button}><Text style={s.buttonText}>完整隱私說明（瀏覽器）</Text></Pressable>
    </View>
    <View style={s.section}><Text accessibilityRole="header" style={s.heading}>備份與資料復原（Windows 桌面版）</Text>
      <Text selectable style={s.body}>{'1. 完全關閉 App。\n2. 在檔案總管輸入 %APPDATA%，複製整個 English Listening Lab 資料夾到備份位置；不要只複製 audio。\n3. 還原前先備份目前資料夾並改名，保留原始副本。\n4. 將完整備份放回 %APPDATA%\\English Listening Lab，再啟動並檢查歌曲播放、草稿與成績。'}</Text>
      <Text style={s.body}>備份包含你的私人內容。不要在 App 運行時搬動檔案；乾淨電腦及不同正式版本間的還原仍待驗收。</Text>
    </View>
    <View style={s.section}><Text accessibilityRole="header" style={s.heading}>授權與第三方通知</Text>
      <Text style={s.body}>新增原創內容以個人檢視與非商業本機建置為限，詳見授權全文；既有 MIT 內容、內含工具與素材依各自條款。完整個別授權檔位於安裝目錄的 resources／licenses 與 resources／tools／licenses。</Text>
      <View style={s.actions}>{(['app', 'thirdParty', 'microsoft'] as const).map(key => <Pressable key={key} accessibilityRole="button" accessibilityState={{ expanded: notice === key }} onPress={() => setNotice(notice === key ? null : key)} style={s.button}><Text style={s.buttonText}>{key === 'app' ? '程式授權全文' : key === 'thirdParty' ? '第三方通知全文' : 'Microsoft 元件附加條款'}</Text></Pressable>)}</View>
      {notice && <Text selectable style={s.notice}>{notice === 'app' ? content.appLicense : notice === 'thirdParty' ? content.thirdPartyNotices : content.microsoftRuntimeTerms}</Text>}
    </View>
  </ScrollView></SafeAreaView>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: p.paper },
  page: { padding: 24, maxWidth: 880, width: '100%', alignSelf: 'center', gap: 16, paddingBottom: 64 },
  title: { fontSize: 32, fontWeight: '700', color: p.ink },
  heading: { fontSize: 22, fontWeight: '600', color: p.ink },
  body: { fontSize: 16, lineHeight: 26, color: p.ink },
  section: { gap: 14, borderTopWidth: 1, borderTopColor: p.line, paddingTop: 24, marginTop: 8 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  button: { minHeight: 48, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: p.ink, alignSelf: 'flex-start', justifyContent: 'center' },
  buttonText: { color: p.ink, fontSize: 16, fontWeight: '600' },
  notice: { fontSize: 14, lineHeight: 23, color: p.ink },
});
