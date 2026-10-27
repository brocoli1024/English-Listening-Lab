const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {createHash} = require('node:crypto');
const {buildKey}=require('./ffmpeg-build.cjs');

const SOURCE_NAMES = {
  'yt-dlp': 'yt-dlp.tar.gz',
  deno: 'deno.tar.gz',
  node: 'node.tar.xz',
  ffmpeg: 'ffmpeg.tar.gz',
};

const COMPONENT_REVIEW = {
  node: {
    status:'closed-for-pinned-local-binary',
    openItems:[],
    evidence:['docs/release/node-runtime-option-2026-10-22.md'],
  },
  'yt-dlp': {
    status: 'incomplete',
    openItems: [
      'Confirm component-specific Microsoft redistribution routes, four UCRT filename differences, and recipient-term sufficiency; personal Community eligibility does not establish every redistribution right.',
      'Clean Windows 1.0.2 install/upgrade/playback/data restoration were user-verified; changed candidates still require scoped validation. No full native source rebuild or blanket legal clearance is claimed.',
    ],
    evidence: [
      'docs/release/yt-dlp-native-audit.md',
      'docs/release/yt-dlp-integration-2026-10-23.md',
      'docs/release/python-runtime-materials.md',
      'docs/release/curl-native-materials.md',
    ],
  },
  deno: {
    status: 'incomplete',
    openItems: [
      'Obtain applicable MIT notices for bundled fqdn 0.5.2 and deno_native_certs 0.3.0.',
      'Complete mapping of bundled V8/Chromium notices to the Deno Windows binary.',
      'Keep sacabase 2.0.0 as lower-priority inclusion pending; its Cargo entry alone is not an equivalent release blocker.',
    ],
    evidence: [
      'docs/release/third-party-closure-status.md',
      'docs/release/priority-notice-review-2026-10-20.md',
      'docs/release/deno-binary-inclusion-2026-10-20.md',
      'docs/release/deno-v8-rust-runtime-reachability.json',
    ],
  },
  ffmpeg: {
    status: 'incomplete',
    openItems: [
      'Establish the effective dependency source set and build lock used for the distributed binary.',
      'Complete applicable dependency notices and corresponding source/relink material review.',
    ],
    evidence: [
      'docs/release/third-party-closure-status.md',
      'docs/release/ffmpeg-nested-review.md',
      'docs/release/ffmpeg-librsvg-license-gaps.json',
      'docs/release/rav1e-cc-update-evidence.json',
    ],
  },
};

const NOTICES = [
  {source:'MICROSOFT_RUNTIME_TERMS.txt',packagedPath:'resources/MICROSOFT_RUNTIME_TERMS.txt'},
  {source: 'THIRD_PARTY_NOTICES.md', packagedPath: 'resources/THIRD_PARTY_NOTICES.md'},
  {source: 'desktop/vendor/licenses/NOTICE.txt', packagedPath: 'resources/tools/licenses/NOTICE.txt'},
  {source: 'docs/release/licenses/', packagedPath: 'resources/licenses/'},
];

function sha256File(filename) {
  return createHash('sha256').update(fs.readFileSync(filename)).digest('hex');
}

function resolveExisting(root, relativePath) {
  const absolutePath = path.resolve(root, relativePath);
  if (!absolutePath.startsWith(`${path.resolve(root)}${path.sep}`)) {
    throw new Error(`Path escapes project root: ${relativePath}`);
  }
  if (!fs.existsSync(absolutePath)) throw new Error(`Required review material is missing: ${relativePath}`);
  return absolutePath;
}

function sourceEntries(root, tools) {
  const entries = [];
  for (const tool of tools) {
    if(tool.format==='source-build') {
      if(tool.name!=='ffmpeg')throw new Error('Unsupported source-built tool');
      const receipt=JSON.parse(fs.readFileSync(resolveExisting(root,'desktop/vendor/ffmpeg-build-receipt.json'),'utf8'));
      const inputs=['desktop/ffmpeg-build.lock.json','docs/release/lame-svn-source.json','scripts/build-ffmpeg.py','scripts/build-ffmpeg.sh','scripts/ffmpeg-build.cjs'];
      if(receipt.buildKey!==buildKey(inputs.map(file=>fs.readFileSync(resolveExisting(root,file)))))throw new Error('FFmpeg build key mismatch; installed tools need rebuilding');
      if(JSON.stringify(Object.keys(receipt.sources).sort())!==JSON.stringify(['ffmpeg-build.tar.gz','ffmpeg.tar.gz','lame.tar.gz']))throw new Error('Incomplete FFmpeg build source set');
      for(const [filename,item] of Object.entries(receipt.sources))entries.push({component:tool.name,version:tool.version,filename,repositoryPath:`desktop/vendor/sources/${filename}`,url:filename==='ffmpeg.tar.gz'?tool.sourceUrl:null,expectedSha256:item.sha256,provenance:'Verified local source build receipt'});
      if(receipt.sources['ffmpeg.tar.gz'].sha256!==tool.sourceSha256)throw new Error('FFmpeg build source differs from locked upstream archive');
      for(const item of tool.additionalSources||[]) {
        if(!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(item.filename))throw new Error('Invalid supplementary source archive name');
        entries.push({component:tool.name,version:tool.version,filename:item.filename,repositoryPath:`desktop/vendor/sources/${item.filename}`,url:item.url,expectedSha256:item.sha256,provenance:'Pinned supplementary runtime source'});
      }
      continue;
    }
    const name = SOURCE_NAMES[tool.name];
    if (tool.sourceSha256) {
      if (!name) throw new Error(`No source archive mapping for tool ${tool.name}`);
      entries.push({
        component: tool.name,
        version: tool.version,
        filename: name,
        repositoryPath: `desktop/vendor/sources/${name}`,
        url: tool.sourceUrl,
        expectedSha256: tool.sourceSha256,
      });
    }
    if (tool.buildSourceSha256) {
      entries.push({
        component: tool.name,
        version: tool.version,
        filename: `${tool.name}-build.tar.gz`,
        repositoryPath: `desktop/vendor/sources/${tool.name}-build.tar.gz`,
        url: tool.buildSourceUrl,
        expectedSha256: tool.buildSourceSha256,
      });
    }
  }

  const materialLock=path.resolve(root,'desktop/yt-dlp-materials.lock.json');
  if(fs.existsSync(materialLock)) {
    for(const item of JSON.parse(fs.readFileSync(materialLock,'utf8')).inputs) {
      if(!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(item.filename))throw new Error('Invalid material filename');
      entries.push({component:'yt-dlp',filename:item.filename,repositoryPath:`desktop/vendor/sources/${item.filename}`,url:item.url,expectedSha256:item.sha256,kind:item.kind,evidence:'desktop/yt-dlp-materials.lock.json',provenance:'desktop/yt-dlp-materials.lock.json'});
    }
  }
  if (entries.length === 0) throw new Error('No pinned source archives are declared in desktop/tools.lock.json');
  const names = entries.map(entry => entry.filename).sort();
  if (new Set(names).size !== names.length) throw new Error('Duplicate source archive name in desktop/tools.lock.json');

  const sourceDir = resolveExisting(root, 'desktop/vendor/sources');
  const localNames = fs.readdirSync(sourceDir).filter(name => fs.statSync(path.join(sourceDir, name)).isFile()).sort();
  if (JSON.stringify(localNames) !== JSON.stringify(names)) {
    throw new Error(`Source directory does not match locked archives: expected ${names.join(', ')}, found ${localNames.join(', ')}`);
  }

  for (const entry of entries) {
    if (!/^[a-f0-9]{64}$/i.test(entry.expectedSha256 || '')) throw new Error(`Invalid locked SHA-256 for ${entry.filename}`);
    const filename = resolveExisting(root, entry.repositoryPath);
    const actualSha256 = sha256File(filename);
    if (actualSha256 !== entry.expectedSha256.toLowerCase()) throw new Error(`SHA-256 mismatch for ${entry.filename}`);
    Object.assign(entry, {sha256: actualSha256, bytes: fs.statSync(filename).size, evidence: entry.evidence || 'desktop/tools.lock.json'});
  }
  return entries.sort((left, right) => left.filename < right.filename ? -1 : left.filename > right.filename ? 1 : 0);
}

function archiveMembers(root, archivePath) {
  const listing = execFileSync('tar', ['-tzf', archivePath], {cwd: root, windowsHide: true, encoding: 'utf8'});
  return listing.split(/\r?\n/)
    .map(member => member.replace(/^\.\//, '').replace(/\/$/, ''))
    .filter(member => member && member !== '.')
    .sort();
}

function archiveMemberSha256(root, archivePath, member) {
  const bytes = execFileSync('tar', ['-xOf', archivePath, member], {
    cwd: root,
    windowsHide: true,
    maxBuffer: 512 * 1024 * 1024,
  });
  return createHash('sha256').update(bytes).digest('hex');
}

function installers(root) {
  const releaseDir = resolveExisting(root, 'release');
  const version = require(path.resolve(root, 'package.json')).version;
  const names = fs.readdirSync(releaseDir).filter(name => name.endsWith(`${version}-Setup.exe`)).sort();
  if (names.length === 0) throw new Error('No Windows Setup.exe was found in release');
  return names.map(name => {
    const repositoryPath = `release/${name}`;
    const filename = resolveExisting(root, repositoryPath);
    const sha256 = sha256File(filename);
    const sidecarPath = `${filename}.sha256`;
    if (!fs.existsSync(sidecarPath)) throw new Error(`Installer checksum sidecar is missing: ${name}.sha256`);
    const sidecar = fs.readFileSync(sidecarPath, 'utf8').trim();
    if (sidecar !== `${sha256}  ${name}`) throw new Error(`Installer checksum sidecar does not match: ${name}.sha256`);
    return {filename: name, repositoryPath, sha256, bytes: fs.statSync(filename).size, version};
  });
}

function validateNotices(root) {
  for (const notice of NOTICES) {
    const absolutePath = resolveExisting(root, notice.source);
    if (notice.source.endsWith('/') && !fs.readdirSync(absolutePath).length) {
      throw new Error(`Packaged notice directory is empty: ${notice.source}`);
    }
  }
  return NOTICES;
}

function writeAttachmentManifest({root = path.resolve(__dirname, '..'), generatedAt = new Date().toISOString()} = {}) {
  const toolsLock = JSON.parse(fs.readFileSync(resolveExisting(root, 'desktop/tools.lock.json'), 'utf8'));
  const sourceContents = sourceEntries(root, toolsLock.tools);
  const sourceArchivePath = resolveExisting(root, 'release/third-party-sources.tar.gz');
  const members = archiveMembers(root, sourceArchivePath);
  const expectedMembers = sourceContents.map(item => item.filename).sort();
  if (JSON.stringify(members) !== JSON.stringify(expectedMembers)) {
    throw new Error(`Source bundle contents do not match the locked list: expected ${expectedMembers.join(', ')}, found ${members.join(', ')}`);
  }
  for (const item of sourceContents) {
    const bundledSha256 = archiveMemberSha256(root, sourceArchivePath, item.filename);
    if (bundledSha256 !== item.sha256) throw new Error(`Source archive member SHA-256 mismatch for ${item.filename}`);
    item.bundledSha256 = bundledSha256;
  }

  const components = toolsLock.tools.map(tool => {
    const review = tool.name==='ffmpeg' && tool.format==='source-build' ? {
      status:'closed-for-pinned-local-build',
      openItems:[],
      evidence:['docs/release/ffmpeg-source-build.md','docs/release/ffmpeg-runtime-source-evidence.json','docs/release/third-party-closure-status.md'],
    } : COMPONENT_REVIEW[tool.name];
    if (!review) throw new Error(`No closure review entry for tool ${tool.name}`);
    return {
      name: tool.name,
      version: tool.version,
      status: review.status,
      sourceArchives: sourceContents.filter(item => item.component === tool.name).map(item => item.filename),
      openItems: review.openItems,
      evidence: review.evidence,
    };
  });
  const evidencePaths = [...new Set(components.flatMap(component => component.evidence))];
  for (const evidence of evidencePaths) resolveExisting(root, evidence);

  const index = JSON.parse(fs.readFileSync(resolveExisting(root, 'docs/release/collected-source-index.json'), 'utf8'));
  const manifest = {
    schemaVersion: 1,
    generatedAt,
    purpose: 'Private Windows review build; this manifest does not approve public distribution.',
    packageVersion: require(path.resolve(root, 'package.json')).version,
    publicDistributionApproved: false,
    sourceClosureComplete: false,
    installers: installers(root),
    notices: validateNotices(root),
    sourceArchive: {
      filename: 'third-party-sources.tar.gz',
      repositoryPath: 'release/third-party-sources.tar.gz',
      sha256: sha256File(sourceArchivePath),
      bytes: fs.statSync(sourceArchivePath).size,
      contents: sourceContents,
    },
    components,
    candidateInventory: {
      repositoryPath: 'docs/release/collected-source-index.json',
      archiveCount: index.archiveCount,
      totalBytes: index.totalBytes,
      problems: index.problems.length,
      completeCorrespondingSource: index.completeCorrespondingSource,
      scope: 'Candidate and reference archive inventory; not an approved public attachment list or complete corresponding source.',
    },
  };

  const outputPath = path.resolve(root, 'release/third-party-source-manifest.json');
  fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

module.exports = {writeAttachmentManifest};
