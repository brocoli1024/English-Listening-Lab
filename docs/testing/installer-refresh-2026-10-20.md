# Windows 安裝包更新驗證 — 2026-10-20

範圍：以目前專案鎖定版本重新產製本機 1.0.0 Windows x64 安裝候選，更新過期資源。不是套件全面升版，也沒有對外發布。

## 更新前

- 舊安裝檔：2026-10-17 的 English-Listening-Lab-1.0.0-Setup.exe。
- 舊 SHA-256：38842a866bb1704a28d8cbc5a195ca771ded0abaa55e5a40d2ec29af58b18d8e。
- 原安裝檔、blockmap、checksum 已備份到 release/archive-before-refresh-2026-10-20/。
- 舊散布目錄相較目前來源有 1,198 個新增或變更資源，包含通知總表與 1,197 個授權材料；完整清單見 installer-refresh-2026-10-20-before.json。
- 從備份安裝包實際解出應用程式，確認桌面 .cjs 與目前來源相同、THIRD_PARTY_NOTICES.md 已過期。

## 已執行的檢查

- 型別檢查通過。
- Jest 6 組、45 項測試通過。初次因沙箱系統暫存路徑 EPERM 無法建立轉換快取；改用專案內測試暫存目錄後通過。
- 桌面測試 18 項通過。
- Expo web export 完成；初次打包因沙箱無法解析 github.com 失敗，後續使用正常建置環境重試。
- 新 win-unpacked 通過 checkPackage：工具 checksum、授權資源、桌面入口與必要內容一致。
- 舊安裝包解出的 App 使用專用 upgrade-profile，啟動、橋接隔離、音訊存取及重新載入持久化檢查通過。

## 最終結果

- electron-builder 重試退出碼 0，安裝檔、blockmap 已更新；desktop:check-package 退出碼 0，重新產生 checksum 與 vendor/sources 附件。
- 新安裝檔 249,317,297 bytes，SHA-256：3345582f76165d81d8767389a84c2227851b43d3543f3bea516a5554eec21725。
- 實際解開新版 NSIS 內的 app-64.7z，3,372 個檔案與新 win-unpacked 逐位元相同；解包後再次通過 checkPackage。
- app.asar 內目前 28 個桌面程式與匯出檔案與工作來源相同。Deno SHA-256 保持 e020f3e232bd16e33768dee528e5983349c962952051ced0a5d58ad42f5d9b33，因此此前此二進位的包含性證據仍適用。
- 新版解包 App 使用舊版建立的同一個隔離 upgrade-profile，通過重啟／更新持久化測試；音訊、匯入歌曲資料、草稿與成績保留，程序退出碼 0。
- Authenticode 狀態為 NotSigned。結構化結果見 installer-refresh-2026-10-20-after.json。

## 限制

本輪驗證本機候選，未宣稱第三方材料缺口已結案。fqdn、deno_native_certs 仍待適用通知；sacabase 為包含性待判定。其他材料門檻見 docs/release/third-party-closure-status.md。既有 third-party-sources.tar.gz 僅涵蓋 vendor/sources，不能視為完整相依來源附件。

同版本重新打包以安裝檔 SHA-256 區分。解包及隔離資料相容性測試不等於乾淨 Windows 機器上的 NSIS 安裝／解除安裝驗證。
