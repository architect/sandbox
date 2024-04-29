const arc = require('@architect/eslint-config')

module.exports = [
  ...arc,
  {
    ignores: [
      '**/*-vendor.js',
      'scratch/',
      'test/mock',
    ],
  },
]
