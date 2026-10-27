"""Build the Windows CLI tools from pinned inputs; all output stays in desktop/.downloads."""
import argparse
import concurrent.futures
import gzip
import hashlib
import io
import json
import os
import pathlib
import shutil
import subprocess
import tarfile
import time
import urllib.request
import zipfile

def digest(file):
    with file.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()

def safe_relative(value):
    path = pathlib.PurePosixPath(value)
    if path.is_absolute() or ':' in value or '\\' in value or '..' in path.parts:
        raise ValueError('Unsafe input path: ' + value)
    return path

def source_tar(target, files):
    with target.open('wb') as raw, gzip.GzipFile(fileobj=raw, mode='wb', mtime=0, filename='') as zipped, tarfile.open(fileobj=zipped,mode='w') as archive:
        for name, file in sorted(files.items()):
            data=file.read_bytes()
            info=tarfile.TarInfo(name)
            info.size=len(data)
            info.mode=0o755 if name.endswith('.sh') else 0o644
            info.mtime=1767225600
            archive.addfile(info,io.BytesIO(data))

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--root',required=True)
    parser.add_argument('--build-key',required=True)
    args=parser.parse_args()
    root=pathlib.Path(args.root).resolve()
    if len(args.build_key)!=64 or any(c not in '0123456789abcdef' for c in args.build_key):
        raise ValueError('Invalid build key')
    lock=json.loads((root/'desktop/ffmpeg-build.lock.json').read_text())
    build=root/'desktop/.downloads/ffmpeg-build'/args.build_key
    build.mkdir(parents=True,exist_ok=True)
    cache=root/'desktop/.downloads/ffmpeg-inputs'
    cache.mkdir(parents=True,exist_ok=True)

    def obtain(item, seeds=()):
        expected=item['sha256']
        if len(expected)!=64 or not item['url'].startswith('https://'):
            raise ValueError('Unpinned source input')
        target=cache/expected
        if target.is_file() and digest(target)==expected:
            return target
        for file in seeds:
            if file.is_file() and digest(file)==expected:
                shutil.copyfile(file,target)
                return target
        last=None
        for attempt in range(3):
            try:
                with urllib.request.urlopen(item['url'],timeout=120) as response, target.open('wb') as output:
                    shutil.copyfileobj(response,output)
                if digest(target)!=expected:
                    raise ValueError('SHA-256 mismatch: '+item['url'])
                return target
            except (OSError,ValueError) as error:
                last=error
                if attempt<2:
                    time.sleep(2)
        raise last

    ffsource=obtain(lock['ffmpeg'],[root/'desktop/vendor/sources/ffmpeg.tar.gz',root/'desktop/.downloads'/lock['ffmpeg']['sha256']])
    lame_manifest=root/safe_relative(lock['lame']['manifest'])
    if digest(lame_manifest)!=lock['lame']['manifestSha256']:
        raise ValueError('LAME source manifest SHA-256 mismatch')
    lame=json.loads(lame_manifest.read_text())
    def get_lame(item):
        relative=safe_relative(item['path'])
        source=obtain(item,[root/'desktop/.downloads/compliance/lame-r6835'/relative])
        target=build/'src/lame'/relative
        target.parent.mkdir(parents=True,exist_ok=True)
        shutil.copyfile(source,target)
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        list(pool.map(get_lame,lame['files']))
    if not (build/'src/ffmpeg/configure').is_file():
        (build/'src/ffmpeg').mkdir(parents=True,exist_ok=True)
        subprocess.run(['tar','-xf',str(ffsource),'-C',str(build/'src/ffmpeg'),'--strip-components=1'],check=True)

    base=obtain(lock['msys2'],[root/'desktop/.downloads/ffmpeg-spike/msys2-base.tar.xz'])
    msys=build/'msys64'
    if not (msys/'usr/bin/bash.exe').is_file():
        subprocess.run(['tar','-xf',str(base),'-C',str(build)],check=True)
    def get_package(item):
        filename=safe_relative(item['filename'])
        source=obtain(item,[root/'desktop/.downloads/ffmpeg-spike/msys64/var/cache/pacman/pkg'/filename])
        shutil.copyfile(source,msys/'var/cache/pacman/pkg'/filename)
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        list(pool.map(get_package,lock['msys2']['packages']))
    env={**os.environ,'MSYSTEM':'UCRT64','CHERE_INVOKING':'1','SOURCE_DATE_EPOCH':str(lock['sourceDateEpoch'])}
    bash=msys/'usr/bin/bash.exe'
    logs=build/'logs'
    logs.mkdir(exist_ok=True)
    if not (build/'toolchain-ready').exists():
        with (logs/'toolchain-install.log').open('w') as log:
            subprocess.run([str(bash),'-lc','pacman -U --noconfirm /var/cache/pacman/pkg/*.pkg.tar.zst'],env=env,stdout=log,stderr=subprocess.STDOUT,check=True)
        (build/'toolchain-ready').write_text('Pinned archives installed\n')
    packages=subprocess.run([str(bash),'-lc','pacman -Q'],env=env,capture_output=True,text=True,check=True).stdout
    if sorted(packages.splitlines())!=sorted(lock['msys2']['expectedInstalledPackages']):
        raise ValueError('Installed toolchain differs from pinned package inventory')
    (logs/'toolchain-packages.txt').write_text(packages)
    (build/'scripts').mkdir(exist_ok=True)
    shutil.copyfile(root/'scripts/build-ffmpeg.sh',build/'scripts/build-ffmpeg.sh')
    # cygpath runs in this isolated MSYS2 installation; no guessed drive mapping.
    script=subprocess.run([str(msys/'usr/bin/cygpath.exe'),'-u',str(build/'scripts/build-ffmpeg.sh')],capture_output=True,text=True,check=True).stdout.strip()
    subprocess.run([str(bash),'-lc','bash "$1"','build-ffmpeg',script],env=env,check=True)

    output=build/'output'
    (output/'bin').mkdir(parents=True,exist_ok=True)
    (output/'licenses').mkdir(exist_ok=True)
    (output/'sources').mkdir(exist_ok=True)
    binaries=['ffmpeg.exe','ffprobe.exe','libmp3lame-0.dll','libwinpthread-1.dll']
    imports={}
    for name in binaries:
        source=build/'prefix/bin'/name
        shutil.copyfile(source,output/'bin'/name)
        dump=subprocess.run([str(msys/'ucrt64/bin/objdump.exe'),'-p',str(source)],capture_output=True,text=True,check=True).stdout
        imports[name]=[line.split('DLL Name:',1)[1].strip() for line in dump.splitlines() if 'DLL Name:' in line]
    configuration=(build/'build-ffmpeg/config.h').read_text()
    for name in ['GPL','NONFREE','VERSION3','LIBRAV1E','LIBRSVG','LIBJXL','LIBSHADERC','LIBPLACEBO','VULKAN']:
        if f'#define CONFIG_{name} 0' not in configuration:
            raise ValueError('Unexpected FFmpeg configuration: '+name)
    for name in ['LIBMP3LAME','SCHANNEL']:
        if f'#define CONFIG_{name} 1' not in configuration:
            raise ValueError('Missing FFmpeg feature: '+name)
    shutil.copyfile(ffsource,output/'sources/ffmpeg.tar.gz')
    source_tar(output/'sources/lame.tar.gz',{'lame/'+x['path']:build/'src/lame'/x['path'] for x in lame['files']})
    recipe_files=['desktop/ffmpeg-build.lock.json','docs/release/lame-svn-source.json','scripts/build-ffmpeg.sh','scripts/build-ffmpeg.py','scripts/ffmpeg-build.cjs']
    source_tar(output/'sources/ffmpeg-build.tar.gz',{name:root/name for name in recipe_files})
    for file in (build/'src/ffmpeg').glob('COPYING*'):
        shutil.copyfile(file,output/'licenses'/('FFmpeg-'+file.name))
    for source,name in [(build/'src/ffmpeg/LICENSE.md','FFmpeg-LICENSE.md'),(build/'src/lame/COPYING','LAME-COPYING'),(build/'src/lame/README','LAME-README'),(msys/'ucrt64/share/licenses/libwinpthread/COPYING','libwinpthread-COPYING'),(msys/'ucrt64/share/licenses/crt/COPYING.MinGW-w64-runtime.txt','MinGW-w64-runtime.txt'),(msys/'ucrt64/share/licenses/libgcc/COPYING.RUNTIME','GCC-RUNTIME-EXCEPTION'),(msys/'ucrt64/share/licenses/libgcc/COPYING3','GCC-COPYING3')]:
        shutil.copyfile(source,output/'licenses'/name)
    notice='FFmpeg 8.1.3-ell-local1: LGPL-2.1-or-later, plus source-file notices.\nLAME SVN r6835: LGPL-2.0-or-later; shared libmp3lame DLL.\nMinGW-w64/winpthreads: see preserved runtime notices.\nWindows system DLLs are provided by Windows and are not copied into this archive.\nCorresponding source: ffmpeg.tar.gz, lame.tar.gz, ffmpeg-build.tar.gz in the release source attachment.\nBuild input lock: desktop/ffmpeg-build.lock.json.\n'
    (output/'licenses/BUILD-NOTICE.txt').write_text(notice)
    # Preserve source-file copyright/license comment blocks as additional references.
    import re
    with (output/'licenses/SOURCE-HEADER-NOTICES.txt').open('w',encoding='utf-8') as notices:
        notices.write('Conservative source-tree notice references; inclusion here does not assert every file was linked. Full original sources are preserved separately.\n')
        for tree in ['ffmpeg','lame']:
            for file in sorted((build/'src'/tree).rglob('*')):
                if file.is_file() and file.suffix in ['.c','.h','.S','.asm']:
                    text=file.read_text(encoding='utf-8',errors='replace')
                    blocks=re.findall(r'/\*.*?\*/',text,re.S)
                    selected=[b for b in blocks if any(x in b.lower() for x in ['copyright','permission is hereby','license','redistribution'])]
                    if file.suffix=='.asm':
                        selected+=['\n'.join(line for line in text.splitlines()[:120] if line.lstrip().startswith(';'))]
                    if selected:
                        notices.write('\n--- '+tree+'/'+file.relative_to(build/'src'/tree).as_posix()+' ---\n'+'\n'.join(selected)+'\n')
    archive=output/'ffmpeg-tools.zip'
    with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as zipped:
        for folder in ['bin','licenses']:
            for file in sorted((output/folder).rglob('*')):
                if file.is_file():
                    zipped.write(file,file.relative_to(output).as_posix())
    def entry(file):
        return {'path':file.relative_to(build).as_posix(),'sha256':digest(file),'bytes':file.stat().st_size}
    receipt={'schema':1,'buildKey':args.build_key,'archive':entry(archive),'binaries':{name:entry(output/'bin'/name) for name in binaries},'sources':{file.name:entry(file) for file in sorted((output/'sources').iterdir())},'imports':imports,'license':'LGPL-2.1-or-later and bundled notices','publicDistributionApproved':False}
    (build/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
    print('Pinned source build and receipt complete.',flush=True)

if __name__=='__main__':
    main()
