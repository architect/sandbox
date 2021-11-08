let printed = []

/**
 * Warn the user if node has resolved a dependency outside their function's folder
 */
module.exports = function warn (params) {
  let { missing = [], inventory, src, update } = params
  let { inv } = inventory
  if (missing.length) {
    let dirs = {
      lambda: src,
      shared: inv?.shared?.src,
      views: inv?.views?.src,
    }
    let deps = {}
    missing.forEach(m => {
      let bits = m.split('::')
      if (!deps[bits[0]]) deps[bits[0]] = [ bits[1] ]
      else deps[bits[0]].push(bits[1])
    })

    // Remove AWS-SDK, that's bundled in Lambda
    missing = missing.filter(dep => !dep.endsWith('::aws-sdk'))
    // Do we still have anything left?
    if (missing.length) {
      let plural = missing.length > 1

      let run = msg => `Please run: ${msg}`
      let instructions = Object.entries(deps).map(([ type, deps ]) => {
        if (type === 'root') return run(`npm i ${deps.join(' ')}`)
        else return run(`cd ${dirs[type]} && npm i ${deps.join(' ')}`)
      })
      if (printed.includes(instructions)) return
      else {
        printed.push(instructions)
        update.warn(`You may have ${plural ? 'dependencies' : 'a dependency'} that could be inaccessible in production`)
        update.status(null, ...instructions)
      }
    }
  }
}
