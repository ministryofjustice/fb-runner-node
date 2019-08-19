module.exports = () => ({
  files: [
    { pattern: 'lib/**/*.js', load: false },
    '!lib/**/*.unit.spec.js',
    { pattern: 'bin/**/*.js', load: false },
    { pattern: 'data/**/*.json', load: false },
    { pattern: 'lib/spec/**/*.json', load: false },
    { pattern: 'src/views/**/*', load: false },
    { pattern: 'dist/**/*', load: false }
  ],
  tests_notes: 'https://glebbahmutov.com/blog/how-to-correctly-unit-test-express-server/ - tried delete require.cache[require.resolve(\'serve-static\')]',
  tests: [
    'lib/bracket-notation-path/**/*.unit.spec.js',
    'lib/client/**/*.unit.spec.js',
    'lib/constants/**/*.unit.spec.js',
    'lib/editor/**/*.unit.spec.js',
    'lib/evaluate-condition/**/*.unit.spec.js',
    'lib/format/**/*.unit.spec.js',
    'lib/middleware/**/*.unit.spec.js',
    '!lib/middleware/routes-cached/*.unit.spec.js',
    '!lib/middleware/routes-static/*.unit.spec.js',
    '!lib/middleware/user-data/*.unit.spec.js',
    'lib/module/**/*.unit.spec.js',
    'lib/page/**/*.unit.spec.js',
    'lib/redact/**/*.unit.spec.js',
    'lib/route/**/*.unit.spec.js',
    'lib/server/**/*.unit.spec.js',
    'lib/user/**/*.unit.spec.js'
  ],
  env: {
    type: 'node'
  },
  testFramework: 'tape'
})
