# curl-impersonate v2.0.0 原生來源材料

2026-10-16：本批涵蓋已與 yt-dlp 內附 DLL 比對一致的官方 Windows x64 libcurl 資產之 CMake 原生來源集合。

## 已完成

- curl 8.21.0、BoringSSL commit 156c7b75ae9b8c3b3f847acf264f17594c3859fb、zlib 1.3.1、Zstandard 1.5.7、Brotli 1.2.0、nghttp2 1.63.0、ngtcp2 1.20.0、nghttp3 1.15.0，共 8 份完整上游來源壓縮檔。
- 每份 SHA-256 與 curl-impersonate 固定提交 ec41b71ce888806bfec56ada7a7258d333eb3d19 的 CMakeLists.txt 相符；打包前再次讀取校驗。
- 主授權文字，以及 13 份來源樹內額外 LICENSE/COPYING/NOTICE/COPYRIGHT 檔已保留；部分屬建置／測試用途，保留不代表它們全部進入 DLL。
- Windows 建置批次檔、workflow、CMakeLists.txt 與 BoringSSL/Brotli/curl/nghttp3/ngtcp2 的 5 份上游 patch 保存於 curl-build/；完整 curl-impersonate 來源包亦隨附。
- Windows 設定 USE_LIBIDN2=OFF、使用 WinIDN，故沒有將 Linux/macOS 的 libidn2/libunistring 列作本批 Windows 相依。

## 本機附件

release/curl-native-source-materials-v2.0.0.tar.gz，附獨立 .sha256。內含來源壓縮檔、建置資料、比對證據及目前收集的授權文字（含其他元件聲明，為保守保留）。清單見 curl-native-sources.json。

## 範圍與剩餘項目

本批是上游固定建置來源與授權的收集／雜湊驗證，沒有執行 Windows 從原始碼重建，不宣稱可位元重現。未完成整個 yt-dlp 的 Python／原生 runtime／間接相依材料，也未完成 Deno、FFmpeg 的整體發行材料。Microsoft 靜態 runtime 的散布聲明仍需一起核對。

安裝包尚未重建，GitHub 公開發行限制維持。已保存的來源與 patches 不曾套用到 App 或替換內附 DLL。

重取來源：node scripts/collect-curl-native-sources.cjs（需網路及 tar；依固定上游 CMake 校驗碼下載）。額外授權附件與整合壓縮包此次另行整理，重取腳本本身不重建整合附件。
