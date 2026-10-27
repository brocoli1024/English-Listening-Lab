# Windows desktop verification — 2026-10-15

## Verified

- 37 Expo/Jest tests passed, including metadata rollback and retry of the same desktop download token.
- 17 Node desktop tests passed: path/range/HEAD handling, owner/origin validation, metadata/subtitles, bounded process output, timeout/cancel, descendant termination, UTF-8 chunk boundaries, persistent audio, inspection cancellation and immediate retry.
- TypeScript and lint passed, including the final packaging pass.
- Expo Web/Android/iOS exports passed. Web assets were rebuilt after the cancellation fix.
- Actual Electron 44.7.2 launched with isolated userData; renderer has the restricted bridge and no Node require. Range audio fetch, local WAV playback, reload and persisted audio resolution passed.
- Actual desktop UI displayed the YouTube entry. Inspected screenshots are retained under `desktop/.test-data/evidence/`.
- Offline integration with a fake downloader and real renderer/IPC/disk storage passed both flows: English subtitles -> preview -> saved song, and missing subtitles -> save blocked -> TXT selection -> preview -> saved song. These tests do not prove real YouTube downloads.
- Bundled yt-dlp 2026.08.19, Deno 2.9.7, FFmpeg/ffprobe n8.1.3-9-g29e619e767 all ran using absolute paths with PATH empty. Required yt-dlp isolation flags are available.
- Tool downloads passed pinned full SHA-256 verification. FFmpeg source and build scripts, yt-dlp source, and Deno source were collected.
- Independent review found one important issue (Cancel during inspection); a failing regression test reproduced it, then passed after the fix. Additional split UTF-8 corruption was reproduced and fixed.
- NSIS installer generation and package inventory/hash checks passed. The installer is unsigned (Authenticode status: NotSigned).
- Actual installation into a Chinese path containing spaces passed. The installed application launched, saved audio, survived reinstalling the same version, and resolved the earlier audio after process restart. This verifies same-version reinstall preservation, not an upgrade between different released versions.
- Silent uninstall returned exit code 0; the test-installed executable was removed. The review installer in release/ was retained.
- Live YouTube metadata inspection and download/conversion passed using the official Big Buck Bunny fixture (video aqz-KE-bpKQ). Output: MP3, 10,154,157 bytes, duration 634.578146 seconds, no English subtitle track. Temporary audio was released and the job directory was empty afterwards. Attribution: (c) 2008 Blender Foundation / www.bigbuckbunny.org; CC BY 3.0 per https://peach.blender.org/about/. The fixture is not included in the app or its library.

## Still being verified / incomplete

- A live video with English subtitles was not tested; subtitle parsing and both UI flows were verified offline. One successful live download does not establish compatibility with every YouTube video or future challenge changes.
- Complete corresponding sources/relink materials for bundled FFmpeg dependencies and complete notices/sources for yt-dlp executable dependencies: incomplete. Current source bundle is partial, not distribution clearance.
- GitHub publication: not performed; no remote/repository destination is configured.

## Isolation

All Electron UI tests used explicit paths below the ignored `desktop/.test-data/` directory. The user's browser origin/library and normal `%APPDATA%\English Listening Lab` profile were not used for tests. The test profiles and their imported songs were removed after verification; screenshots were retained in `desktop/.test-data/evidence/`. No testing songs were added to the user's library.
