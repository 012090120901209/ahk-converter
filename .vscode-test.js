const { defineConfig } = require('@vscode/test-cli');

module.exports = defineConfig({
  files: 'dist/test/suite/**/*.test.js',
  extensionDevelopmentPath: [
    './',
    './test/fixtures/extensions/thqby.vscode-autohotkey2-lsp'
  ],
  skipExtensionDependencies: true,
  mocha: {
    ui: 'tdd',
    color: true,
    timeout: 10000
  }
});
