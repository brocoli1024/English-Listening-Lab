#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
# The Python driver copies this recipe into the isolated build directory.
ROOT="$PWD"
export PATH="/ucrt64/bin:/usr/bin:$PATH"
export SOURCE_DATE_EPOCH=1767225600
mkdir -p prefix build-lame build-ffmpeg logs
cd build-lame
../src/lame/configure --prefix="$ROOT/prefix" --disable-frontend --disable-decoder --disable-static --enable-shared LDFLAGS=-Wl,--no-insert-timestamp > "$ROOT/logs/lame-configure.log" 2>&1
make -j8 > "$ROOT/logs/lame-make.log" 2>&1
make install > "$ROOT/logs/lame-install.log" 2>&1
cd "$ROOT/build-ffmpeg"
../src/ffmpeg/configure --prefix="$ROOT/prefix" --disable-autodetect --disable-doc --disable-debug --disable-ffplay --enable-libmp3lame --enable-schannel --extra-version=ell-local1 --extra-cflags="-I$ROOT/prefix/include" --extra-ldflags="-L$ROOT/prefix/lib -Wl,--no-insert-timestamp" > "$ROOT/logs/ffmpeg-configure.log" 2>&1
make -j8 > "$ROOT/logs/ffmpeg-make.log" 2>&1
make install > "$ROOT/logs/ffmpeg-install.log" 2>&1
cp /ucrt64/bin/libwinpthread-1.dll "$ROOT/prefix/bin/"
echo SOURCE_BUILD_COMPLETE
