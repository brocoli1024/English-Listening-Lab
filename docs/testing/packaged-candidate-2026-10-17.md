# Windows candidate validation — 2026-10-17

The current candidate includes imported-song deletion and the compatible dependency updates recorded in release/progress.md.

- `npm run desktop:build` completed with exit code 0.
- `npm run desktop:check-package` completed with exit code 0: bundled tools match their hashes, required application files are present, and application/third-party license resources match the working source byte for byte.
- `scripts/packaged-desktop-smoke.cjs` passed both seed and restart runs against `release/win-unpacked/English Listening Lab.exe`, using the isolated `desktop/.test-data/release-2026-10-17` profile. Audio, imported-library data, difficulty draft and results survived process restart; the bridge remained isolated. Both processes exited with code 0.
- Installer SHA-256: `38842a866bb1704a28d8cbc5a195ca771ded0abaa55e5a40d2ec29af58b18d8e`.
- Authenticode status: `NotSigned`.

This validates the packaged executable on the development machine. It does not establish clean-machine installation, installer upgrade, or completeness of third-party corresponding sources. The generated `third-party-sources.tar.gz` contains only the main vendor source directory and is not a complete dependency-source bundle. This candidate is not yet approved for public release.
