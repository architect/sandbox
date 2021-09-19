let tiny = require('tiny-json-http')
let sandbox = require('../../../../src')
let { url } = require('./_lib')

// Verify sandbox shut down
let verifyShutdown = (t, err) => {
  t.equal(err.code, 'ECONNREFUSED', 'Sandbox succssfully shut down')
}

let shutdown = t => {
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

let shutdownAsync = async t => {
  let result = await sandbox.end()
  if (result !== 'Sandbox successfully shut down') {
    t.fail('Did not get back Sandbox shutdown message')
  }
  try {
    await tiny.get({ url })
    t.fail('Sandbox did not shut down')
  }
  catch (err) {
    verifyShutdown(t, err)
  }
}


module.exports = {
  verifyShutdown,
  shutdown,
  shutdownAsync,
}
