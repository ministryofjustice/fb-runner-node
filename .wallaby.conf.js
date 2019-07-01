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
  ztests: [
    'lib/**/*.unit.spec.js',
    '!lib/middleware/routes-cached/*.unit.spec.js',
    '!lib/middleware/routes-static/*.unit.spec.js',
    '!lib/middleware/user-data/*.unit.spec.js',
    '!lib/service-data/**/*.unit.spec.js'
  ],
  xtests: [

  ],
  antitests: [
    'lib/middleware/user-data/*.unit.spec.js',
    'lib/service-data/**/*.unit.spec.js'
  ],
  tests: [
    'lib/bracket-notation-path/**/*.unit.spec.js',
    'lib/client/**/*.unit.spec.js',
    // '!lib/client/metrics/**/*.unit.spec.js',
    'lib/constants/**/*.unit.spec.js',
    'lib/editor/**/*.unit.spec.js',
    'lib/evaluate-condition/**/*.unit.spec.js',
    'lib/format/**/*.unit.spec.js',
    'lib/middleware/**/*.unit.spec.js',
    '!lib/middleware/metrics/**/*.unit.spec.js',
    'lib/module/**/*.unit.spec.js',
    'lib/page/**/*.unit.spec.js',
    // '!lib/page/add-item/**/*.unit.spec.js',
    // '!lib/page/format-properties/**/*.unit.spec.js',
    // '!lib/page/kludge-updates/**/*.unit.spec.js',
    // '!lib/page/process-input/**/*.unit.spec.js',
    // '!lib/page/process-uploads/**/*.unit.spec.js', // stet user-data
    // '!lib/page/redirect-next-page/**/*.unit.spec.js',
    // '!lib/page/remove-item/**/*.unit.spec.js',
    // '!lib/page/set-composite/**/*.unit.spec.js',
    // '!lib/page/set-control-names/**/*.unit.spec.js',
    // '!lib/page/set-errors/**/*.unit.spec.js',
    // '!lib/page/set-form-content/**/*.unit.spec.js',
    // '!lib/page/set-multipart-form/**/*.unit.spec.js',
    // '!lib/page/set-repeatable/**/*.unit.spec.js',
    // '!lib/page/set-service/**/*.unit.spec.js',
    // '!lib/page/set-uploads/**/*.unit.spec.js',
    // '!lib/page/skip-components/**/*.unit.spec.js',
    // '!lib/page/skip-page/**/*.unit.spec.js',
    // '!lib/page/update-control-names/**/*.unit.spec.js',
    // '!lib/page/utils/**/*.unit.spec.js',
    // '!lib/page/validate-input/**/*.unit.spec.js',
    // 'lib/**/*.unit.spec.js',
    // '!lib/middleware/auth/*.unit.spec.js',
    // '!lib/middleware/csrf/*.unit.spec.js',
    // '!lib/middleware/error-handler/*.unit.spec.js',
    // '!lib/middleware/healthcheck/*.unit.spec.js',
    // '!lib/middleware/locals/*.unit.spec.js',
    // '!lib/middleware/logger/*.unit.spec.js',
    // '!lib/middleware/metrics/*.unit.spec.js',
    // '!lib/middleware/nunjucks-configuration/*.unit.spec.js',
    // '!lib/middleware/ping/*.unit.spec.js',
    // '!lib/middleware/referrer/*.unit.spec.js',
    // '!lib/middleware/robot/*.unit.spec.js',
    '!lib/middleware/routes-cached/*.unit.spec.js', // stet
    // '!lib/middleware/routes-metadata/*.unit.spec.js',
    // '!lib/middleware/routes-nunjucks/*.unit.spec.js',
    // '!lib/middleware/routes-output/*.unit.spec.js',
    '!lib/middleware/routes-static/*.unit.spec.js', // stet
    // '!lib/middleware/use-async/*.unit.spec.js',
    '!lib/middleware/user-data/*.unit.spec.js', // stet process-uploads
    // '!lib/middleware/user-session/*.unit.spec.js',
    'lib/redact/**/*.unit.spec.js',
    'lib/route/**/*.unit.spec.js',
    'lib/server/**/*.unit.spec.js',
    // 'lib/service-data/**/*.unit.spec.js',
    'lib/user/**/*.unit.spec.js'
  ],
  env: {
    type: 'node'
  },
  testFramework: 'tape'
})
