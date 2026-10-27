# 四項發布準備追蹤 — 2026-10-22

本輪按「包裝、乾淨環境、發布流程、使用者支援」分開驗收；部分完成不代表正式發布批准。

| 項目 | 本輪證據／進展 | 尚待完成 |
| --- | --- | --- |
| 安裝包 | 1.0.1 候選已產製；包內版本、授權、第三方通知、工具雜湊與應用檔案檢查通過；installer SHA-256 與 sidecar 相符 | 需在乾淨 VMware 執行完整驗收 |
| 實機驗收 | 本機 Electron 啟動、完整資料夾備份及還原通過；舊 0x80000003 本輪未重現 | 使用者將使用 VMware；乾淨 Windows 安裝、不同版本 NSIS 升級及還原依 vmware-acceptance-2026-10-21.md 執行 |
| 發布流程 | 私人 brocoli1024/English-Listening-Lab 已建立並設為 origin；main 分支 Windows CI 的測試、工具準備、1.0.1 建置與包內檢查全數通過；私人審查 artifact 已上傳；公開 Release 數量為 0 | 乾淨 VMware 驗收；第三方來源材料仍未結案 |
| 支援入口 | 首頁新增「說明與支援」，版本、授權全文、第三方通知、更新、問題回報方式及完整備份還原可直接讀取；使用者已確認設計 | 私人測試階段向安裝包提供者回報；公開回報與下載入口尚未開通 |

## 本機驗收結果

支援頁內容生成測試先因生成器不存在失敗，實作後通過。版本與兩份通知直接由 package.json、LICENSE、THIRD_PARTY_NOTICES.md 產生；桌面匯出前會更新。支援頁導航、版本、兩份全文及返回首頁的實際 Electron 檢查通過。應用測試 45 項、桌面測試 19 項、型別檢查與 lint 通過。

備份還原證據位於忽略目錄 desktop/.test-data/backup-restore-i59uvW/result.json：關閉後逐位元複製、還原曲庫／草稿／成績／音訊、原始資料未變動。這是開發主機測試，不是乾淨虛擬機通過證明。

## 真實英文字幕

既有 Big Buck Bunny 測試只通過音訊下載，subtitleKind=none，不算英文字幕驗收。另以公開 TED 影片 H14bBuluwB8 實際走現有 jobs 下載流程，取得 manual 英文字幕、轉成 6,075 字元時間軸歌詞，音訊 5,967,789 bytes；已釋放暫存工作，不將內容隨 App 散布。結果見 live-english-captions-2026-10-21.json。這是當日當地網路的成功結果，不保證所有影片或未來服務狀態。

## 相依風險驗收

29 個 npm audit 受影響節點目前已逐一歸到三項底層公告，並檢查 1.0.1 的 `dist`、`app.asar`、封裝規則與實際隨附原生工具版本。針對此私人候選，未發現 npm 公告元件隨 App 散布；四項隨附執行檔高於本次核對的上游修補門檻。細節見 [相依風險驗收](dependency-risk-review-2026-10-22.md)。

這項判定不結案第三方來源／重新連結材料，也不替代乾淨 VMware 安裝與升級驗收。公開發布仍關閉。

## 私人 GitHub CI — 2026-10-22

私人儲存庫 `main` 的提交 `2dc483b` 觸發 Windows desktop workflow run #2，結果 success：45 項應用測試、19 項桌面測試、型別檢查、lint、第三方工具 digest 驗證、1.0.1 NSIS 建置、包內檢查及 artifact 上傳都通過。審查 artifact 為 300,794,954 bytes，預定 2027-01-19 到期：[windows-desktop-review-build](https://github.com/brocoli1024/English-Listening-Lab/actions/runs/39648468262/artifacts/12369230640)。查核時私人 repo 的 GitHub Releases 數量為 0；未建立公開或草稿 Release。
