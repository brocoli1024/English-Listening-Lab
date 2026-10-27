"""Reconcile recorded source archives; never imply dependency closure."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPORTS = ROOT / 'docs/release'
records = {}
problems = []

def add(raw, expected, evidence):
    raw = raw.replace('\\', '/')
    path = (ROOT / raw).resolve()
    if not path.is_relative_to(ROOT) or not raw.startswith('desktop/'):
        return
    if not raw.endswith(('.tar.gz', '.tar.xz', '.tar.bz2', '.crate', '.zip')):
        return
    key = path.relative_to(ROOT).as_posix()
    record = records.setdefault(key, {'path': key, 'evidence': [], 'expectedHashes': []})
    if evidence not in record['evidence']:
        record['evidence'].append(evidence)
    if expected and expected not in record['expectedHashes']:
        record['expectedHashes'].append(expected)

def visit(value, evidence):
    if isinstance(value, dict):
        for field in ('file', 'path', 'archive'):
            if isinstance(value.get(field), str):
                add(value[field], value.get('sha256') or value.get('lockChecksum') or value.get('cratesIoChecksum'), evidence)
        if isinstance(value.get('source'), str):
            add(value['source'], value.get('sourceSha256'), evidence)
        if isinstance(value.get('file'), str) and value['file'].startswith('pyinstaller-'):
            add('desktop/.downloads/compliance/' + value['file'], value.get('sha256'), evidence)
        for child in value.values():
            visit(child, evidence)
    elif isinstance(value, list):
        for child in value:
            visit(child, evidence)

for report in REPORTS.glob('*.json'):
    if report.name == 'collected-source-index.json':
        continue
    visit(json.loads(report.read_text(encoding='utf-8-sig')), report.name)

for tool in json.loads((ROOT / 'desktop/tools.lock.json').read_text())['tools']:
    if tool.get('sourceSha256'):
        name = {'yt-dlp':'yt-dlp.tar.gz', 'deno':'deno.tar.gz', 'ffmpeg':'ffmpeg.tar.gz'}[tool['name']]
        add(f'desktop/vendor/sources/{name}', tool['sourceSha256'], 'desktop/tools.lock.json')
    if tool.get('buildSourceSha256'):
        add('desktop/vendor/sources/ffmpeg-build.tar.gz', tool['buildSourceSha256'], 'desktop/tools.lock.json')

for name, field in [('deno-v8-source.tar.gz','sha256'), ('rusty-v8-source.tar.gz','sha256')]:
    for item in json.loads((REPORTS / 'deno-v8/source-hashes.json').read_text()):
        if item['file'] == name:
            add('desktop/.downloads/compliance/' + name, item[field], 'deno-v8/source-hashes.json')

for report, cache in [('deno-registry-sources.json', 'deno-crates'),
                      ('ffmpeg-librsvg-registry-sources.json', 'ffmpeg-librsvg-crates')]:
    for package in json.loads((REPORTS / report).read_text())['packages']:
        add(f"desktop/.downloads/compliance/{cache}/{package['name']}-{package['version']}.crate",
            package['checksum'], report)

total = 0
for record in records.values():
    path = ROOT / record['path']
    if not path.is_file():
        problems.append({'path': record['path'], 'error': 'missing'})
        continue
    digest = hashlib.file_digest(path.open('rb'), 'sha256').hexdigest()
    record.update(sha256=digest, bytes=path.stat().st_size)
    total += record['bytes']
    if any(expected != digest for expected in record['expectedHashes']):
        problems.append({'path': record['path'], 'error': 'recorded hash mismatch'})

result = {'completeCorrespondingSource': False,
          'scope': 'Inventory of locally recorded archives, including candidate supersets and failed-comparison reference archives. Not an approved public attachment list, shipped SBOM, or full dependency closure. Expected digests retain provenance in their evidence records; this index does not imply all are independently published upstream hashes.',
          'archiveCount': len(records), 'totalBytes': total, 'problems': problems,
          'archives': sorted(records.values(), key=lambda record: record['path'])}
(REPORTS / 'collected-source-index.json').write_text(json.dumps(result, indent=2)+'\n', encoding='utf-8')
print(json.dumps({'archives': len(records), 'bytes': total, 'problems': problems}))
if problems:
    raise SystemExit(1)
