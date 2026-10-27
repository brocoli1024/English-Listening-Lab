# 1.0.1 相依風險驗收 — 2026-10-22

## 判定

已完成 1.0.1 私人候選的相依範圍查核。這次查核沒有發現已知 npm 弱點元件進入安裝包執行路徑；實際隨附的 Electron、Deno、yt-dlp 與 FFmpeg 版本也高於本次核對的上游修補版本。這是針對固定候選與已公開公告的判定，不代表沒有未知弱點。

## npm audit 結果如何解讀

2026-10-21 的 `npm audit --omit=dev` 記錄列出 29 個受影響節點（24 high、5 moderate、0 critical），但底層公告集中在三個套件：`braces@3.0.3`、`node-forge@1.4.0`、`sprintf-js@1.0.3`。`npm explain` 顯示這些節點由 Expo CLI、Metro 及建置工具相依路徑帶入。這些版本確實在對應公告的受影響範圍內；其中 `braces` 與 `node-forge` 的公告目前沒有列出修補版本，不能靠盲目降級消除。

桌面封裝設定排除整個 `node_modules`。本機 1.0.1 的 `dist` 與實際 `app.asar` 亦以這四個套件名稱及 Metro matcher 名稱搜尋，沒有命中。因此 29 個節點是安裝／建置相依風險指標，不等同 29 個已隨 App 散布的弱點。搜尋是靜態範圍查核，不能證明不存在改名、內嵌或未知的相同程式碼。

## 實際隨附執行檔

版本取自鎖定工具清單，檔案 digest 由 `desktop:check-package` 驗證：

| 元件 | 候選版本 | 上游修補基準與判定 |
| --- | --- | --- |
| Electron | 44.7.2 | 10 月公告列出的 Electron 44 修補門檻最高為 44.5.0；候選高於該版本。應用不載入不受信任的遠端頁面。 |
| Deno | 2.9.7 | 本次核對的 Windows 命令注入修補於 2.7.10、Miller-Rabin 修補於 2.8.1；候選高於兩者。 |
| yt-dlp | 2026.08.19 | `--netrc-cmd` 注入修補版本為 2026.02.21；不安全副檔名修補版本為 2026.06.09；候選高於兩者。 |
| FFmpeg | n8.1.3-9-g29e619e767 | FFmpeg 官方安全頁將 8.1.2 列為本次核對之 2026 CVE 修補版本；候選依據 8.1.3 後續來源建置。 |

實際工具版本仍須在乾淨 Windows VMware 驗收安裝後確認；本機封裝 digest 通過不代替乾淨機驗收。

## 尚存風險與發布邊界

私人候選的 npm 建置相依公告保留在追蹤清單內；它們可能影響執行 Expo 建置工具的建置主機，因此 CI 僅使用唯讀 `contents` 權限，並應持續追蹤上游修補。使用者提供的音訊與遠端影片仍由 FFmpeg／yt-dlp 解析，應隨上游安全更新重建及重新驗收。

這次技術風險查核不結案第三方授權來源材料。`docs/release/third-party-closure-status.md` 仍列有 Deno／FFmpeg／yt-dlp 來源與建置材料缺口；公開發布繼續關閉。此候選只供私人審查與 VMware 測試。

## 可重現查核

- `npm audit --omit=dev` 原始輸出：[`dependency-audit-2026-10-21.json`](dependency-audit-2026-10-21.json)
- 封裝排除規則：[`electron-builder.yml`](../../electron-builder.yml)
- 上游公告：[braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)、[node-forge](https://github.com/advisories/GHSA-86w9-cpqp-85rv)、[sprintf-js](https://github.com/advisories/GHSA-hp3w-g68c-fv3c)
- 官方執行檔資訊：[Electron 44.7.2](https://github.com/electron/electron/releases/tag/v44.7.2)、[Electron security advisories](https://github.com/electron/electron/security/advisories)、[Deno 2.9.7](https://github.com/denoland/deno/releases/tag/v2.9.7)、[Deno security advisories](https://github.com/denoland/deno/security)、[yt-dlp 2026.08.19](https://github.com/yt-dlp/yt-dlp/releases/tag/2026.08.19)、[yt-dlp netrc-cmd advisory](https://github.com/yt-dlp/yt-dlp/security/advisories/GHSA-g3gw-q23r-pgqm)、[yt-dlp unsafe extension advisory](https://github.com/yt-dlp/yt-dlp/security/advisories/GHSA-c6mh-fpjc-4pr3)、[FFmpeg security](https://ffmpeg.org/security.html)
- 1.0.1 實機與安裝測試：[`vmware-acceptance-2026-10-21.md`](vmware-acceptance-2026-10-21.md)
