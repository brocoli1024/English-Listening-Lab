const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([expoConfig, { ignores: ['dist/**', 'node_modules/**', 'release/**', 'desktop/vendor/**', 'desktop/.downloads/**', 'desktop/.test-data/**', 'desktop/.staging-*/**'] }]);
