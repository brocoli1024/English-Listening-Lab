# Python runtime 與間接相依材料 — 2026-10-16

## 本批完成

- 官方 Python 3.10.11 來源與授權、PC/crtlicense.txt、PCbuild 建置參照。
- Python 官方 embed-amd64 版與 yt-dlp 內附共有的 24 個 DLL/PYD 逐位元一致，證據見 python-runtime-binary-match.json。未宣稱未比對檔案亦相同。
- 使用官方 Python 3.10.11 的 marshal/dis 讀取已抽出的 PYZ code object，不執行模組。確認 __version__ 指定為 cffi 2.1.1、pycparser 3.00、charset_normalizer 3.5.0、idna 3.18。排除 cffi 內另一個 verifier version 0.8.6 的混淆。
- 上述 4 份 PyPI sdist 及主授權已取得，SHA-256 與 PyPI metadata 一致；這證明來源包版本，未宣稱原生 pyd 已可位元重建。
- 依 CPython 3.10.11 get_externals.bat 取得官方 cpython-source-deps 參照：bzip2 1.0.8、libffi 3.3.0、OpenSSL 1.1.1t、SQLite 3.40.1.0、xz 5.2.5、zlib 1.2.13。各自記錄解析提交、來源網址與本機 SHA-256，保留頂層授權。

## 驗證界線

PyPI 的 4 份來源有獨立發布的 SHA-256 可比對。Python 主來源與 cpython-source-deps 下載自官方網站／儲存庫，SHA-256 為本機紀錄，沒有聲稱通過簽章或官方發布 digest 驗證。全部 11 份來源在整合打包前重新讀取校驗。

cffi 的 sdist 包含自己的 Windows libffi 原始碼；CPython 的 libffi 來源僅對應 CPython runtime，兩者不得混淆。PyInstaller bootloader 與 runtime hooks 的精確打包版本／來源仍未結案；完整 yt-dlp 授權審查與重建證據、Deno、FFmpeg 發行材料亦未結案。

## 附件

release/python-runtime-indirect-materials-3.10.11.tar.gz 及 .sha256，包含 11 份來源壓縮檔、版本／二進位比對證據、建置參照、目前授權集合。未包含使用者歌曲、音檔或個人設定。沒有替換 App 內工具、重建安裝包或解除公開發行限制。

取得工具：scripts/collect-ytdlp-indirect-sources.cjs、scripts/collect-python-runtime-sources.cjs。後者記錄官方參照當次解析的 commit；重跑需比較 manifest，不能假定 branch 名稱永久不變。
