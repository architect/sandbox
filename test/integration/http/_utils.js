let sandbox = require('../../../src')
let tiny = require('tiny-json-http')
let url = `http://localhost:${process.env.PORT || 3333}`

// Verify sandbox shut down
let verifyShutdown = (t, err) => {
  t.equal(err.code, 'ECONNREFUSED', 'Sandbox succssfully shut down')
}

let shutdown = (t) => {
  sandbox.end((err, result) => {
    if (err) t.fail(err)
    if (result !== 'Sandbox successfully shut down') {
      t.fail('Did not get back Sandbox shutdown message')
    }
    tiny.get({
      url
    }, err => {
      if (err) verifyShutdown(t, err)
      else t.fail('Sandbox did not shut down')
    })
  })
}

module.exports = { url, verifyShutdown, shutdown }
