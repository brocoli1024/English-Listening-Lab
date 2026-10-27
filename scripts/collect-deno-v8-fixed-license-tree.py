"""Preserve license-like files from the exact V8 commit pinned by rusty_v8."""
import hashlib
import json
import pathlib
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
COMMIT = 'ac1e23989121713ca642f6650b34deff7b686896'
TREE_PATH = ROOT / 'desktop/.downloads/compliance/deno-v8-fixed-tree-recursive.json'
DEST_ROOT = ROOT / 'docs/release/licenses/deno-v8-fixed-tree'
OUT = ROOT / 'docs/release/deno-v8/fixed-v8-license-files.json'

tree = json.loads(TREE_PATH.read_text(encoding='utf-8'))
if tree.get('sha') != COMMIT or tree.get('truncated'):
    raise SystemExit('The cached V8 tree is not the expected complete pinned commit')

selected = []
for entry in tree['tree']:
    if entry.get('type') != 'blob':
        continue
    name = pathlib.PurePosixPath(entry['path']).name.lower()
    if name.startswith(('license', 'copying', 'notice', 'copyright')):
        selected.append(entry)

results = []
for entry in selected:
    rel = pathlib.PurePosixPath(entry['path'])
    url = f'https://raw.githubusercontent.com/denoland/v8/{COMMIT}/{rel.as_posix()}'
    request = urllib.request.Request(url, headers={'User-Agent': 'English-Listening-Lab-release-audit'})
    with urllib.request.urlopen(request, timeout=45) as response:
        data = response.read()
    destination = DEST_ROOT.joinpath(*rel.parts)
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(data)
    results.append({
        'path': destination.relative_to(ROOT).as_posix(),
        'upstreamPath': rel.as_posix(),
        'url': url,
        'gitBlobSha': entry['sha'],
        'sha256': hashlib.sha256(data).hexdigest(),
        'bytes': len(data),
    })

report = {
    'commit': COMMIT,
    'treeSha': tree['sha'],
    'treeEntryCount': len(tree['tree']),
    'truncated': False,
    'scope': 'License-like files in the complete V8 source tree pinned by rusty_v8; includes tests, benchmarks, and tooling, and is not a runtime-only inventory.',
    'complete': False,
    'files': results,
}
OUT.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'commit': COMMIT, 'files': len(results), 'bytes': sum(x['bytes'] for x in results)}))
