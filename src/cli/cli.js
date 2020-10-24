#!/usr/bin/env node
let inventory = require('@architect/inventory')
let cli = require('./index.js')
let pkg = require('../../package.json')
let update = require('update-notifier')
let ver = pkg.version
let options = process.argv

/**
 * Entry for Sandbox running its own CLI
 *   Same as the @architect/architect caller, but calls updater + sets own version
 */
update({ pkg, shouldNotifyInNpmScript: true })
  .notify({ boxenOpts: {
    padding: 1,
    margin: 1,
    align: 'center',
    borderColor: 'green',
    borderStyle: 'round',
    dimBorder: true
  } })

// Get the base port for HTTP / WebSockets; tables + events key off this
// CLI args > env var
function port () {
  let port = Number(process.env.PORT) || 3333
  let findPort = option => [ '-p', '--port', 'port' ].includes(option)
  if (options && options.some(findPort)) {
    let thePort = i => options[options.indexOf(i) + 1]
    if (options.includes('-p'))
      port = thePort('-p')
    else if (options.includes('--port'))
      port = thePort('--port')
    else if (options.includes('port'))
      port = thePort('port')
  }
  return port
}

// Hit it
inventory({}, function (err, result) {
  if (err) {
    console.log(err)
    process.exit(1)
  }
  cli({
    needsValidCreds: false,
    options,
    version: `Sandbox ${ver}`,
    port: port(),
    inventory: result
  },
  function _done (err) {
    if (err) {
      console.log(err)
      process.exit(1)
    }
  })
})
