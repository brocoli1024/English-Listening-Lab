# PyInstaller 精確來源核對 — 2026-10-16

## 結果

yt-dlp 2026.08.19 的 Windows x64 固定建置清單指定 **PyInstaller 6.22.0**，使用 yt-dlp/Pyinstaller-Builds **2026.08.19.215425** 的自建 wheel。不是直接假定使用 PyPI 同版 wheel。

- wheel SHA-256：`294099ecb5fdd2a13ae4c29006d4e335b697a63b6a16cf052b90ec2b40bef05a`，與官方鎖定清單一致。
- 發行說明指定上游 commit：`70fc17210920bce17f4ab09bbf8104b0dbd45338`。來源壓縮檔與建置配方已保存。
- 從實際 yt-dlp.exe 讀出的 5 個 loader/bootstrap 與 3 個 runtime hooks，使用 Python 3.10.11 編譯 wheel 中原始碼比對：8 個皆相符。只遞迴正規化 code object 的檔案路徑，不執行抽出的程式。這 8 個原始碼與固定 commit 亦一致（忽略 CRLF/LF）。
- wheel 的 Windows x64 console bootloader 與 yt-dlp.exe 的 `.text`、`.data`、`.rdata`、`.pdata`、`.xdata`、`.idata`、`.reloc` 原始區段一致；`.bss` 原始資料皆空。`.rsrc` 不同，未宣稱整份 PE 檔案相同，也未做來源重建。

## 授權與範圍

[固定來源 COPYING.txt](https://github.com/pyinstaller/pyinstaller/blob/70fc17210920bce17f4ab09bbf8104b0dbd45338/COPYING.txt) 規定 PyInstaller 為 GPL-2.0-or-later，bootloader 與 loader 有 Bootloader Exception，runtime hooks 為 Apache-2.0。保留完整原文於 `licenses/PyInstaller-6.22.0-COPYING.txt`，含各授權全文。wheel 與來源授權文字相同，只有換行不同。建置配方的 LICENSE 另存，不套用到 PyInstaller 本體。

這項例外不取代 yt-dlp 本身或其他相依的授權。此批完成版本／來源對應及授權材料收集，不代表全部工具已可公開發行。建置清單的 setuptools、pefile、altgraph、hooks-contrib 等是建置相依清單，不據此宣稱全數進入執行檔；編譯器工具鏈及完整可重現建置未在本批驗證。

## 重跑與附件

在專案根目錄使用已取得的官方 Python：

```powershell
desktop/.downloads/compliance/python310/python.exe scripts/verify-pyinstaller-materials.py
```

輸入及來源：

- [yt-dlp 固定 Windows x64 requirements](https://github.com/yt-dlp/yt-dlp/blob/2026.08.19/bundle/requirements/win-x64-pyinstaller.txt)
- [自建 wheel 發行頁](https://github.com/yt-dlp/Pyinstaller-Builds/releases/tag/2026.08.19.215425)
- [PyInstaller 固定來源](https://codeload.github.com/pyinstaller/pyinstaller/tar.gz/70fc17210920bce17f4ab09bbf8104b0dbd45338)
- [建置配方來源](https://codeload.github.com/yt-dlp/Pyinstaller-Builds/tar.gz/refs/tags/2026.08.19.215425)

證據：`pyinstaller-provenance.json`、`pyinstaller-build/`。來源包雜湊為本機計算；僅 wheel 有上述獨立鎖定雜湊比對。建置配方標籤解析的 Git 物件保存於 `pyinstaller-build/pyinstaller-build-ref.json`。

附件：`release/pyinstaller-materials-6.22.0.tar.gz` 及 `.sha256`。包含兩份來源壓縮檔、wheel、證據、授權及驗證腳本。未重建 App 安裝包；新授權透過既有 licenses 資源設定於下次建置納入。公開發行限制保持不變。
