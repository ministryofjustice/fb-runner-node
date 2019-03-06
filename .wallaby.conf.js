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
  tests_notes: 'https://glebbahmutov.com/blog/how-to-correctly-unit-test-express-server/ - tried delete require.cache[require.resolve(\'serve-static\')]',
  tests: [
    'lib/**/*.unit.spec.js',
    "!lib/middleware/routes-cached/*.unit.spec.js",
    "!lib/middleware/routes-static/*.unit.spec.js"
  ],
  env: {
    type: 'node'
  },
  testFramework: 'tape'
})
