"""Collect the full locked registry-source superset, not a shipped-component SBOM."""
import concurrent.futures, hashlib, json, pathlib, tarfile, time, tomllib, urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
CACHE = ROOT / 'desktop/.downloads/compliance/ffmpeg-librsvg-crates'
OUT = ROOT / 'docs/release'
CACHE.mkdir(parents=True, exist_ok=True)
with tarfile.open(ROOT / 'desktop/.downloads/compliance/ffmpeg-enabled/99-librsvg-7612431eb02dc009319094f8513d63c1faaecfb4.tar.gz') as archive:
    packages = tomllib.loads(archive.extractfile('librsvg-7612431eb02dc009319094f8513d63c1faaecfb4/Cargo.lock').read().decode())['package']

def collect(package):
    name, version = package['name'], package['version']
    key = name + '-' + version
    url = 'https://static.crates.io/crates/' + name + '/' + key + '.crate'
    target = CACHE / (key + '.crate')
    result = dict(package, url=url, licenses=[])
    try:
        if not target.exists():
            for attempt in range(3):
                try:
                    with urllib.request.urlopen(url, timeout=60) as response:
                        data = response.read()
                    assert hashlib.sha256(data).hexdigest() == package['checksum'], 'Download checksum mismatch'
                    target.write_bytes(data)
                    break
                except Exception:
                    if attempt == 2:
                        raise
                    time.sleep(2)
        assert hashlib.sha256(target.read_bytes()).hexdigest() == package['checksum'], 'Cached checksum mismatch'
        with tarfile.open(target) as archive:
            manifest = tomllib.loads(archive.extractfile(key+'/Cargo.toml').read().decode())
            result['declaredLicense'] = manifest['package'].get('license')
            for member in archive.getmembers():
                parts = pathlib.PurePosixPath(member.name).parts
                if not member.isfile() or not parts or parts[0] != key or '..' in parts:
                    continue
                if not parts[-1].lower().startswith(('license', 'copying', 'notice', 'copyright')):
                    continue
                dest = OUT / 'licenses/ffmpeg-librsvg-cargo-superset' / pathlib.Path(*parts)
                dest.parent.mkdir(parents=True, exist_ok=True)
                data = archive.extractfile(member).read()
                dest.write_bytes(data)
                result['licenses'].append({'path': dest.relative_to(ROOT).as_posix(), 'sha256': hashlib.sha256(data).hexdigest()})
        result['verified'] = True
    except Exception as error:
        result['verified'] = False
        result['error'] = str(error)
    return result

registry = [p for p in packages if p.get('source', '').startswith('registry+')]
results = []
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
    for result in executor.map(collect, registry):
        results.append(result)
        if len(results) % 25 == 0:
            print('Collected', len(results), '/', len(registry), flush=True)
report = {'scope': 'Full Cargo.lock registry superset including build, dev, and other-platform dependencies; not proof all are shipped. Native external sources require separate audit.', 'complete': False, 'packages': results, 'nonRegistry': [p for p in packages if p.get('source') and not p['source'].startswith('registry+')]}
(OUT/'ffmpeg-librsvg-registry-sources.json').write_text(json.dumps(report, indent=2)+'\n', encoding='utf-8')
failed = [p for p in results if not p['verified']]
print('Verified:', len(results)-len(failed), 'Failed:', len(failed), flush=True)
if failed:
    raise SystemExit(1)
