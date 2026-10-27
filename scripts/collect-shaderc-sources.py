"""Collect exact DEPS revisions without executing the upstream DEPS file."""
import concurrent.futures
import hashlib
import json
import pathlib
import re
import tarfile
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
CACHE = ROOT / 'desktop/.downloads/compliance/ffmpeg-shaderc'
CACHE.mkdir(parents=True, exist_ok=True)
source = ROOT / 'desktop/.downloads/compliance/ffmpeg-enabled/50-shaderc-a8abeb0b8a9d4b11e3d59ca9f4550b8213e733ab.tar.gz'
with tarfile.open(source) as archive:
    deps = archive.extractfile('shaderc-a8abeb0b8a9d4b11e3d59ca9f4550b8213e733ab/DEPS').read().decode()
revisions = dict(re.findall(r"'([a-z0-9_]+)_revision':\s*'([0-9a-f]{40})'", deps))
repositories = {'abseil':'abseil/abseil-cpp', 'effcee':'google/effcee', 'glslang':'KhronosGroup/glslang', 'googletest':'google/googletest', 're2':'google/re2', 'spirv_headers':'KhronosGroup/SPIRV-Headers', 'spirv_tools':'KhronosGroup/SPIRV-Tools'}
assert set(revisions) == set(repositories), 'Review changed DEPS before collecting'

def collect(item):
    name, repository = item
    commit = revisions[name]
    url = f'https://codeload.github.com/{repository}/tar.gz/{commit}'
    dest = CACHE / f'{name}-{commit}.tar.gz'
    result = dict(name=name, repository=repository, commit=commit, url=url, licenses=[])
    try:
        if not dest.exists():
            with urllib.request.urlopen(url, timeout=60) as response:
                data = response.read()
            # Validate archive before persisting it as a reusable download.
            import io
            with tarfile.open(fileobj=io.BytesIO(data)) as archive:
                assert archive.getmembers()
            dest.write_bytes(data)
        result.update(path=dest.relative_to(ROOT).as_posix(), sha256=hashlib.sha256(dest.read_bytes()).hexdigest())
        with tarfile.open(dest) as archive:
            for member in archive.getmembers():
                parts = pathlib.PurePosixPath(member.name).parts
                if not member.isfile() or len(parts) < 2 or '..' in parts or pathlib.PurePosixPath(member.name).is_absolute():
                    continue
                if not parts[-1].lower().startswith(('license', 'copying', 'notice', 'copyright')):
                    continue
                target = ROOT / 'docs/release/licenses/ffmpeg-shaderc' / name / pathlib.Path(*parts[1:])
                target.parent.mkdir(parents=True, exist_ok=True)
                data = archive.extractfile(member).read()
                target.write_bytes(data)
                result['licenses'].append(dict(path=target.relative_to(ROOT).as_posix(), sha256=hashlib.sha256(data).hexdigest()))
        result['downloaded'] = True
    except Exception as error:
        result.update(downloaded=False, error=str(error))
    return result

with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
    results = list(executor.map(collect, repositories.items()))
report = dict(scope='All seven shaderc DEPS entries including test dependencies. SHA-256 values are local integrity records, not upstream published checksums. Nested dependency closure and actual linkage remain unverified.', completeCorrespondingSource=False, parentSource=source.relative_to(ROOT).as_posix(), parentSha256=hashlib.sha256(source.read_bytes()).hexdigest(), packages=results)
(ROOT / 'docs/release/ffmpeg-shaderc-sources.json').write_text(json.dumps(report, indent=2)+'\n', encoding='utf-8')
print(json.dumps({r['name']:r['downloaded'] for r in results}), flush=True)
if not all(r['downloaded'] for r in results):
    raise SystemExit(1)
