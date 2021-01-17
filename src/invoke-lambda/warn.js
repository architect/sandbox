let { updater } = require('@architect/utils')

/**
 * Warn the user if node has resolved a dependency outside their function's folder
 */
module.exports = function warn (params) {
  let { missing = [], inventory, src } = params
  if (missing.length) {
    let dirs = {
      lambda: src,
      shared: inventory.inv.shared && inventory.inv.shared.src,
      views: inventory.inv.views && inventory.inv.views.src,
    }
    let deps = {}
    missing.forEach(m => {
      let bits = m.split('::')
      if (!deps[bits[0]]) deps[bits[0]] = [ bits[1] ]
      else deps[bits[0]].push(bits[1])
    })

    // Remove AWS-SDK, that's bundled in Lambda
    let awsSdk = missing.findIndex(dep => dep === 'aws-sdk')
    if (awsSdk >= 0) {
      missing.splice(awsSdk, 1)
    }
    // Do we still have anything left?
    if (missing.length) {
      let update = updater('Sandbox')
      let plural = missing.length > 1

      update.warn(`You may have ${plural ? 'dependencies' : 'a dependency'} that could be inaccessible in production`)
      let run = msg => `Please run: ${msg}`
      let instructions = Object.entries(deps).map(([ type, deps ]) => {
        if (type === 'root') return run(`npm i ${deps.join(' ')}`)
        else return run(`cd ${dirs[type]} && npm i ${deps.join(' ')}`)
      })
      update.status(null, ...instructions)
    }
  }
}
