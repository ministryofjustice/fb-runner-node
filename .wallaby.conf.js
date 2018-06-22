module.exports = () => ({
  files: [
    { pattern: 'lib/**/*.js', load: false },
    "!lib/**/*.unit.spec.js",
    { pattern: 'bin/**/*.js', load: false },
    { pattern: 'data/**/*.json', load: false },
    { pattern: 'lib/spec/**/*.json', load: false },
    { pattern: 'src/views/**/*', load: false },
    { pattern: 'dist/**/*', load: false }
  ],
  tests: [
    'lib/**/*.unit.spec.js'
  ],
  env: {
    type: 'node'
  },
  testFramework: 'tape',
  workers: {
    restart: true,
    initial: 1,
    regular: 1
  }
})
