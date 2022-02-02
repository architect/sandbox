let cli = require('../src/cli/index.js')
let pkg = require('../package.json')
let ver = pkg.version

// Hit it
cli({
  needsValidCreds: false,
  version: `Sandbox ${ver} (binary)`,
},
function _done (err) {
  if (err) {
    console.log(err)
    process.exit(1)
  }
})
