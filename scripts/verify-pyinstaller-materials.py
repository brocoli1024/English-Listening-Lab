"""Read-only binary comparison; run with the collected CPython 3.10.11 runtime.

Inputs are downloaded official archives in desktop/.downloads/compliance.
Never imports or executes code extracted from yt-dlp.
"""
import hashlib, json, marshal, pathlib, shutil, struct, sys, tarfile, types, zipfile, zlib

assert sys.version_info[:3] == (3, 10, 11), 'Use the verified Python 3.10.11 runtime'
root = pathlib.Path(__file__).resolve().parents[1]
cache = root / 'desktop/.downloads/compliance'
out = root / 'docs/release'
build = out / 'pyinstaller-build'
build.mkdir(exist_ok=True)
sha = lambda b: hashlib.sha256(b).hexdigest()
wheel = cache / 'pyinstaller-6.22.0-win_amd64.whl'
assert sha(wheel.read_bytes()) == '294099ecb5fdd2a13ae4c29006d4e335b697a63b6a16cf052b90ec2b40bef05a'
z = zipfile.ZipFile(wheel)
b = (root / 'desktop/vendor/yt-dlp.exe').read_bytes()
assert sha(b) == '66674953fe251b89f4d08c5f0e35e0728679bd67ab3d7d05c0562af101dd3e7a'
cookie = b.rfind(bytes([77,69,73,12,11,10,11,14]))
length, offset, size = struct.unpack_from('!III', b, cookie+8)
base = cookie+88-length
p = base+offset
entries = {}
while p < base+offset+size:
    n, pos, clen, ulen, compressed, kind = struct.unpack_from('!IIIIBB', b, p)
    assert n >= 18 and p+n <= base+offset+size
    name = b[p+18:p+n].split(b'\0')[0].decode()
    raw = b[base+pos:base+pos+clen]
    entries[name] = zlib.decompress(raw) if compressed else raw
    p += n

def normalize(c):
    if not isinstance(c, types.CodeType):
        return c
    return c.replace(co_filename='<normalized>', co_consts=tuple(normalize(x) for x in c.co_consts))

comparisons = []
for name, raw in entries.items():
    if not name.startswith(('pyimod', 'pyiboot', 'pyi_rth_')):
        continue
    folder = 'hooks/rthooks' if name.startswith('pyi_rth_') else 'loader'
    path = 'PyInstaller/' + folder + '/' + name + '.py'
    original = marshal.loads(raw)
    matches = [level for level in range(3) if normalize(original) == normalize(compile(z.read(path), path, 'exec', optimize=level))]
    comparisons.append({'module': name, 'source': path, 'matchingOptimizationLevels': matches, 'matches': bool(matches)})

def sections(data):
    pe = struct.unpack_from('<I', data, 60)[0]
    assert data[pe:pe+4] == b'PE\0\0'
    count = struct.unpack_from('<H', data, pe+6)[0]
    optional = struct.unpack_from('<H', data, pe+20)[0]
    result = {}
    for i in range(count):
        p = pe+24+optional+i*40
        name = data[p:p+8].rstrip(b'\0').decode()
        size, pos = struct.unpack_from('<II', data, p+16)
        result[name] = data[pos:pos+size]
    return result

exe_sections = sections(b)
boot_sections = sections(z.read('PyInstaller/bootloader/Windows-64bit-intel/run.exe'))
section_matches = [{'section': n, 'exeSha256': sha(exe_sections[n]), 'wheelSha256': sha(v), 'matches': exe_sections[n] == v} for n,v in boot_sections.items() if n in exe_sections]
license_data = z.read('pyinstaller-6.22.0.dist-info/licenses/COPYING.txt')
(out / 'licenses/PyInstaller-6.22.0-COPYING.txt').write_bytes(license_data)
with tarfile.open(cache / 'pyinstaller-source.tar.gz') as t:
    prefix = t.getnames()[0]
    assert t.extractfile(prefix+'/COPYING.txt').read().replace(b'\r\n', b'\n') == license_data.replace(b'\r\n', b'\n'), 'License text mismatch (line endings ignored)'
    for item in comparisons:
        path = item['source']
        assert t.extractfile(prefix+'/'+path).read().replace(b'\r\n', b'\n') == z.read(path).replace(b'\r\n', b'\n'), path
        item['wheelSourceMatchesPinnedCommitIgnoringLineEndings'] = True
with tarfile.open(cache / 'pyinstaller-build-source.tar.gz') as t:
    prefix = t.getnames()[0]
    for path in ['LICENSE', 'README.md', '.github/workflows/build.yml', 'requirements/build.txt', 'pyproject.toml']:
        target = build / ('recipe-'+path.replace('/', '-'))
        target.write_bytes(t.extractfile(prefix+'/'+path).read())
    (out / 'licenses/yt-dlp-Pyinstaller-Builds-LICENSE.txt').write_bytes(t.extractfile(prefix+'/LICENSE').read())
for src in ['ytdlp-build.yml', 'pyinstaller-requirements.txt', 'pyinstaller-build-release.json', 'pyinstaller-build-ref.json']:
    shutil.copyfile(cache/src, build/src)
files = []
for name in ['pyinstaller-source.tar.gz', 'pyinstaller-build-source.tar.gz', wheel.name]:
    files.append({'file': name, 'sha256': sha((cache/name).read_bytes()), 'hashEvidence': 'official locked requirements' if name == wheel.name else 'locally computed; not an independently published digest'})
report = {'version': '6.22.0', 'buildRelease': '2026.08.19.215425', 'upstreamCommit': '70fc17210920bce17f4ab09bbf8104b0dbd45338', 'ytDlpSha256': sha(b), 'files': files, 'loaderComparison': 'Python code objects compared recursively, only co_filename normalized; no extracted code executed', 'modules': comparisons, 'bootloaderSections': section_matches, 'scope': 'Section equality is not whole-executable equality or source rebuild proof.'}
(out/'pyinstaller-provenance.json').write_text(json.dumps(report, indent=2)+'\n', encoding='utf-8')
print(json.dumps(report, indent=2))
assert comparisons and all(x['matches'] for x in comparisons), 'Loader source mismatch'
assert any(x['section'] == '.text' and x['matches'] for x in section_matches), 'Bootloader code section mismatch'
