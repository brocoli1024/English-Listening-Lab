"""Trace unresolved Deno license candidates through Windows normal dependencies."""
import collections
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
META = ROOT / 'desktop/.downloads/compliance/deno-windows-metadata.json'
RECON = ROOT / 'docs/release/deno-windows-license-reconciliation.json'
OUT = ROOT / 'docs/release/deno-unresolved-license-dependency-paths.json'

metadata = json.loads(META.read_text(encoding='utf-8'))
packages = {item['id']: item for item in metadata['packages']}
nodes = {item['id']: item for item in metadata['resolve']['nodes']}
root = next(item['id'] for item in metadata['packages']
            if item['name'] == 'deno' and item['version'] == '2.9.7')

parent = {root: None}
queue = collections.deque([root])
while queue:
    current = queue.popleft()
    for dependency in nodes.get(current, {}).get('deps', []):
        windows_normal = any(
            item.get('kind') is None
            and (item.get('target') is None or 'windows' in item['target'].lower())
            for item in dependency.get('dep_kinds', [])
        )
        if windows_normal and dependency['pkg'] not in parent:
            parent[dependency['pkg']] = current
            queue.append(dependency['pkg'])

def label(package_id):
    package = packages[package_id]
    return f"{package['name']}@{package['version']}"

entries = []
reconciliation = json.loads(RECON.read_text(encoding='utf-8'))
candidate_names = {item['package'] for item in reconciliation['remainingPackages']}
candidate_names.update(item['package'] for item in json.loads(
    (ROOT / 'docs/release/deno-mit-author-license-supplements.json').read_text(encoding='utf-8'))['packages'])
for package_name in sorted(candidate_names):
    name, version = package_name.rsplit('-', 1)
    package_id = next((key for key in parent if packages[key]['name'] == name
                       and packages[key]['version'] == version), None)
    if package_id is None:
        entries.append({'package': package_name, 'normalWindowsDependencyReachable': False})
        continue
    chain = []
    cursor = package_id
    while cursor is not None:
        chain.append(label(cursor))
        cursor = parent[cursor]
    entries.append({
        'package': package_name,
        'normalWindowsDependencyReachable': True,
        'targetKinds': sorted({kind for target in packages[package_id].get('targets', [])
                               for kind in target.get('kind', [])}),
        'shortestPathFromDeno': list(reversed(chain)),
    })

result = {
    'asOf': '2026-10-19',
    'source': 'desktop/.downloads/compliance/deno-windows-metadata.json',
    'root': label(root),
    'method': 'Breadth-first traversal of Cargo resolve nodes from deno 2.9.7, following normal dependency edges (kind=null) whose target is universal or mentions Windows; build-only edges excluded.',
    'scope': 'Cargo resolved dependency reachability only; this includes proc-macro crates that execute during compilation and does not prove final executable linkage.',
    'packages': entries,
}
OUT.write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'unresolved': len(entries), 'normalWindowsReachable': sum(x['normalWindowsDependencyReachable'] for x in entries)}))
