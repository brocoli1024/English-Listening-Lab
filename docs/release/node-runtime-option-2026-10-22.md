> 歷史本機驗證紀錄：本文件不代表接收者電腦已通過驗收。引用的私人測試紀錄未隨儲存庫提供；建置腳本僅需要本文件作來源與範圍說明。

# 隨附 Node.js 替換 Deno — 2026-10-22

使用者已核准此有限設計。本機 1.0.1 候選已改用 Node.js 24.22.1，保留匯入操作及禁止遠端元件／插件的設定。直接拆解新 NSIS 的 app-64.7z 後，資源比對與完整目錄／app.asar 的 Deno 檔名排除檢查通過。Deno 舊材料僅作歷史參考；其上游缺口沒有被宣稱已修復。

## 固定來源與通知

Windows x64 官方 ZIP SHA-256：`d2046d28c2c3dcd211ac5145c0bf30e2047ef9dfb306693c8c6e2eccd8b95fa5`。

官方來源 tar.xz SHA-256：`4f5379796280cdaeb0c2f358fd04b6a16cc4fb7dfa83b5a8c91a9d963b435231`。兩份下載皆重新雜湊並與官方 SHASUMS256.txt 相符。vendor 的 node.exe 與官方 ZIP 解出檔逐位元相同；完整 ZIP LICENSE、README 與來源 LICENSE 原文保存，npm/npx/corepack 未隨附。

ZIP LICENSE 為 160,555 bytes；來源 LICENSE 為 157,609 bytes，僅 CRLF/LF 差異，正規化後完全相同。兩份原文分別保留於 `resources/tools/licenses/node/node-v24.22.1-win-x64/` 及 `resources/tools/licenses/node-LICENSE.txt`。來源封存為附件中的 `node.tar.xz`，不混入舊 deno.tar.gz。

## 功能與封包驗收

實際 production job manager 以固定 yt-dlp、Node、FFmpeg 匯入 H14bBuluwB8，取得 5,967,789 bytes MP3、372.924083 秒音訊及 6,075 字元手動英文字幕；釋放暫存及立即取消清理通過。測試媒體不隨 App 散布。

34 項桌面／建置測試、45 項應用測試、型別檢查、lint、所有工具在空 PATH 執行的驗證通過。封裝應用的支援頁、reload 與程序重啟後曲庫／草稿／成績／音訊保存通過。審查發現的 Node `-version` 舊參數已改為 `--version`，先重現失敗再以實際工具驗證修正。

完整機器可讀證據與新安裝檔 digest：[`node-runtime-migration-2026-10-22.json`](../testing/node-runtime-migration-2026-10-22.json)。

## 範圍限制

一般 metadata 與真實匯入成功不代表所有 JS challenge 路徑已驗證。強制 web client 時 YouTube 回應登入／反機器人驗證牆；不能把它歸因於 Node，也不視為 challenge 成功證據。沒有讀取使用者 cookies。

本項結案只涵蓋固定官方 Node 二進位、完整通知、對應官方來源與本機功能／包內驗證；未聲稱自行重建或可位元重現。yt-dlp 完整元件來源映射與 Microsoft runtime 適用範圍仍未結案，乾淨 Windows VMware 安裝／跨版本升級／還原仍待測。修改只留本機，未推送或建立 Release，公開散布維持關閉。

官方參考：[Node release](https://nodejs.org/en/blog/release/v24.22.1)、[SHA-256](https://nodejs.org/dist/v24.22.1/SHASUMS256.txt)、[完整 LICENSE](https://github.com/nodejs/node/blob/v24.22.1/LICENSE)、[yt-dlp Node 支援](https://github.com/yt-dlp/yt-dlp/wiki/EJS)。
