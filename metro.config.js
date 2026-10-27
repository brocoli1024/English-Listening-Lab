const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
// Release evidence, downloaded source trees and isolated profiles are not app modules.
const generatedDirectories = [
  'desktop/.downloads', 'desktop/.test-data', 'desktop/vendor',
  'release', 'artifacts', 'docs/release',
];
const excluded = generatedDirectories.map(directory => {
  const escaped = path.resolve(__dirname, directory).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped}(?:[/\\\\]|$)`);
});
const existing = config.resolver.blockList;
config.resolver.blockList = [...(Array.isArray(existing) ? existing : existing ? [existing] : []), ...excluded];
module.exports = config;
