module.exports = () => ({
  files: [
    '**/*.js',
    '!tests/**/*.test.js',
    '!node_modules/**/*.*',
    { pattern: '.env', instrument: false },
    { pattern: '.env.example', instrument: false },
  ],

  tests: [
    'tests/**/*.test.js',
  ],

  workers: {
    recycle: true,
  },

  env: {
    type: 'node',
  },

  testFramework: 'mocha',
})
