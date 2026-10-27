"""Export fixed upstream SVN revision through its read-only HTTP directory view."""
import concurrent.futures, hashlib, json, pathlib, time, urllib.parse, urllib.request
from html.parser import HTMLParser
ROOT = pathlib.Path(__file__).resolve().parents[1]
BASE = 'https://svn.code.sf.net/p/lame/svn/!svn/bc/6835/trunk/lame/'
DEST = ROOT/'desktop/.downloads/compliance/lame-r6835'
class Links(HTMLParser):
    def __init__(self):
        super().__init__(); self.links=[]
    def handle_starttag(self,tag,attrs):
        if tag=='a':
            self.links.extend(value for key,value in attrs if key=='href')
def read(url):
    for attempt in range(3):
        try:
            with urllib.request.urlopen(url,timeout=20) as response:
                return response.read()
        except Exception:
            if attempt == 2: raise
            time.sleep(2)
directories=['']; files=[]
while directories:
    folder=directories.pop()
    parser=Links(); parser.feed(read(BASE+folder).decode())
    for link in parser.links:
        decoded=urllib.parse.unquote(link)
        if '/' in decoded.rstrip('/') or '\\' in decoded or ':' in decoded or decoded.startswith('/'):
            continue
        if decoded in ('.','./','..','../') or not decoded:
            continue
        relative=folder+link
        if link.endswith('/'): directories.append(relative)
        else: files.append(relative)
print('Revision 6835 files:',len(files),flush=True)
def collect(relative):
    dest=DEST/urllib.parse.unquote(relative)
    dest.parent.mkdir(parents=True,exist_ok=True)
    try:
        if not dest.exists(): dest.write_bytes(read(BASE+relative))
    except Exception as error:
        print('Failed:',relative,str(error),flush=True)
        return {'path':urllib.parse.unquote(relative),'url':BASE+relative,'error':str(error)}
    data=dest.read_bytes()
    return {'path':dest.relative_to(DEST).as_posix(),'url':BASE+relative,'sha256':hashlib.sha256(data).hexdigest()}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    records=list(pool.map(collect,files))
failed=[x for x in records if 'error' in x]
(ROOT/'docs/release/lame-svn-source.json').write_text(json.dumps({'revision':6835,'baseUrl':BASE,'completeFileExport':not failed,'scope':'HTTP export of fixed SVN file contents; SVN properties and build-generated files not reproduced','files':records},indent=2)+'\n')
print('Saved',len(records)-len(failed),'files with local hashes;',len(failed),'failed')
if failed: raise SystemExit(1)
