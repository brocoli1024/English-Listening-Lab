# 備份還原驗收界線 — 2026-10-17

已執行第一輪：開發版 Electron 在全新隔離 profile 保存音檔與 localStorage 標記，退出後複製完整資料夾；60 個檔案 SHA-256 一致。從複本啟動可讀標記與音檔，原始 profile 雜湊不變。

證據：desktop/.test-data/backup-restore-i2xxvh/result.json。

完整曲庫、難度草稿與成績 fixture 已加入腳本，但尚未執行：自動核准審查因用量限制拒絕啟動新版測試。不得將第一輪狹窄證據當成完整資料還原驗收。亦未驗證乾淨電腦、不同版本升級與正式安裝包。

待執行：node scripts/backup-restore-smoke.cjs。先處理核准服務限制，不使用替代入口繞過。

更新：核准服務恢復後，完整 fixture 測試已按原核准流程執行並通過。desktop/.test-data/backup-restore-XD17Ho/result.json 記錄 60 檔逐位元一致，restoredLibraryDraftAndResults=true，音檔與原 profile 保持不變。這補足前述第一輪的內容覆蓋缺口；仍只代表同版開發 Electron，未取代跨版本與乾淨環境驗收。
