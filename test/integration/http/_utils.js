let sandbox = require('../../../src')
let tiny = require('tiny-json-http')

let url = 'http://localhost:6666'

// Verify sandbox shut down
let verifyShutdown = (t, err) => {
  t.equal(err.code, 'ECONNREFUSED', 'Sandbox succssfully shut down')
}

let shutdown = (t) => {
  sandbox.end(() => {
    tiny.get({
      url
    }, err => {
      if (err) verifyShutdown(t, err)
      else t.fail('Sandbox did not shut down')
    })
  })
}

module.exports = { url, verifyShutdown, shutdown }
