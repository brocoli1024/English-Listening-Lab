> 歷史本機驗證紀錄：本文件不代表接收者電腦已通過驗收。引用的私人測試紀錄未隨儲存庫提供；建置腳本僅需要本文件作來源與範圍說明。

# yt-dlp 本機材料與條款整合 — 2026-10-23

狀態：本機整合與重建完成；公開散布仍關閉。使用者已檢視接收者草稿，發布者 SDK／Visual Studio 資格則明確回覆「尚未確認，先保留待確認」。本報告不把新增接受頁視為最終法律適用性、發布者資格或乾淨 Windows 驗收已通過。

## 已整合

1. typing_extensions 4.16.0、delvewheel 1.13.0、astring／meriyah 及 cffi 內嵌 libffi 的原文已進入正式 licenses 資源。
2. 37 份 yt-dlp 來源／發布物／建置支援輸入固定於 `desktop/yt-dlp-materials.lock.json`。與原有六份來源合計 43 份附件；wheel 明標為 build-support-binary，不把它或 npm 生成檔當成偏好修改形式的原始碼。SDK nupkg 僅作來源身分證據，未納入散布附件。
3. `MICROSOFT_RUNTIME_TERMS.txt` 採已檢視的範圍，附完整 Python CRT 原文及由原始 SDK RTF 轉出的可讀原文。安裝接受頁在安裝前即可閱讀這些原文；支援頁提供相同版本全文。其他開源授權權利保留，SDK 發布者參考資料不表示全套開發工具限制一律套用 App。
4. NSIS 使用不會被 --updated 跳過的接受頁，預設未勾選、下一步停用；拒絕可取消。/S 不代表同意，會退出代碼 2。使用者沒有被代為勾選接受。
5. 材料準備移至既有 vendor 交易的暫存階段；全部輸入完成後才替換成品。下載／雜湊失敗會保留上一套完整工具與來源。

## 驗證

38 項桌面／建置測試與 45 項應用測試通過，型別檢查、lint、網頁匯出與 NSIS 建置通過。封裝支援頁、完整條款、reload／程序重啟後曲庫／草稿／成績／音訊保存通過。

Windows 原生接受頁實測：可讀到條款及引用原文，未接受時下一步 disabled，按取消後視窗關閉。靜默安裝在獨立測試目錄退出 2，零程式檔案；NSIS 模板 `.onInit` 在自訂 guard 前先 SetOutPath，因此可能建立空目錄，不能誤報完全沒有檔案系統變動。

直接拆開 NSIS 的 app-64.7z 後，條款／通知／工具位元比對與 Deno 排除檢查通過。附件 43 項逐一校驗。最新安裝檔 SHA-256、大小與機器可讀結果見 [整合證據](../testing/yt-dlp-integration-2026-10-23.json)。舊 Node 與 FFmpeg 報告的安裝檔 digest 保留為歷史，不是目前同名檔案的 digest。

## 仍未結案

- 發布者適用授權資格／上游再散布路線、條款充分性及最終適用範圍，依 [發布者確認清單](yt-dlp-review-2026-10-22/publisher-checklist.md) 追蹤。
- 乾淨 VMware 的全新安裝、跨版本升級、完整還原，以及實際接受後完成安裝，仍待使用者驗收；本機測試未代替這些項目。
- 不宣稱所有原生靜態相依已自行重建或可位元重現。

未推送、未建立 Release、未聯絡上游。`publicDistributionApproved` 與 `sourceClosureComplete` 維持 false。
