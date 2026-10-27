"""Collect fixed sources tied directly to the shipped FFmpeg enable flags.

Does not execute upstream shell scripts. Transitive sources/submodules remain
separate obligations; successful downloads are not a complete source bundle.
"""
import concurrent.futures, hashlib, json, pathlib, re, tarfile, urllib.request
ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT/'docs/release'
CACHE = ROOT/'desktop/.downloads/compliance/ffmpeg-enabled'
CACHE.mkdir(parents=True, exist_ok=True)
inventory = json.loads((OUT/'ffmpeg-source-references.json').read_text())
flags = set(re.findall(r'--enable-[\w-]+', (OUT/'ffmpeg-build-configuration.txt').read_text()))
selected = [e for e in inventory['entries'] if set(e['configureFlags']) & flags]

def collect(entry):
    result = dict(entry, collected=False, licenses=[])
    repo = entry['references'].get('REPO','').removesuffix('.git')
    commit = entry['references'].get('COMMIT')
    if not commit:
        return dict(result, error='Non-Git source requires revision-aware acquisition')
    name = pathlib.PurePosixPath(entry['script']).stem
    if repo.startswith('https://github.com/'):
        url = repo.replace('https://github.com/','https://codeload.github.com/')+'/tar.gz/'+commit
    elif '.googlesource.com/' in repo:
        url = repo+'/+archive/'+commit+'.tar.gz'
    elif any(host in repo for host in ['https://gitlab.com/', 'https://gitlab.freedesktop.org/', 'https://code.videolan.org/']):
        url = repo+'/-/archive/'+commit+'/'+repo.rsplit('/',1)[-1]+'-'+commit+'.tar.gz'
    else:
        return dict(result, error='Source host requires Git acquisition')
    result['url'] = url
    target = CACHE/(name+'-'+commit+'.tar.gz')
    try:
        if not target.exists():
            with urllib.request.urlopen(url, timeout=90) as response:
                data = response.read()
            # Check archive integrity before preserving a completed download.
            temporary = target.with_suffix('.pending')
            temporary.write_bytes(data)
            with tarfile.open(temporary) as archive:
                archive.getmembers()
            temporary.replace(target)
        with tarfile.open(target) as archive:
            for member in archive.getmembers():
                parts = pathlib.PurePosixPath(member.name).parts
                if not member.isfile() or not parts or '..' in parts or pathlib.PurePosixPath(member.name).is_absolute():
                    continue
                if not parts[-1].lower().startswith(('license','copying','notice','copyright')):
                    continue
                dest = OUT/'licenses/ffmpeg-enabled'/name/pathlib.Path(*parts)
                dest.parent.mkdir(parents=True,exist_ok=True)
                data = archive.extractfile(member).read()
                dest.write_bytes(data)
                result['licenses'].append({'path':dest.relative_to(ROOT).as_posix(),'sha256':hashlib.sha256(data).hexdigest()})
        result.update(collected=True, file=target.relative_to(ROOT).as_posix(), sha256=hashlib.sha256(target.read_bytes()).hexdigest(), hashEvidence='locally computed; source URL pinned by official build recipe, no independent archive digest')
    except Exception as error:
        result['error'] = str(error)
    return result

results=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    for item in pool.map(collect,selected):
        results.append(item)
        print(len(results),'/',len(selected),item['script'],item['collected'],flush=True)
report={'scope':'Direct build-script enable flags matched to actual binary configuration; transitive dependencies, patches and submodules must still be audited','complete':False,'entries':results}
(OUT/'ffmpeg-enabled-sources.json').write_text(json.dumps(report,indent=2)+'\n')
print('Collected',sum(x['collected'] for x in results),'of',len(results),flush=True)
