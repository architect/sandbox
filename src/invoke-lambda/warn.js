let { sep } = require('path')
let { runtimeVersions } = require('lambda-runtimes')
let printed = {
  missing: [],
  version: [],
}
/**
 * Warn the user if node has resolved a dependency outside their function's folder
 */
module.exports = function warn (params) {
  let { cwd, missing = [], lambda, inventory, src, update, version } = params
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
      if (printed.missing.includes(instructions)) return
      else {
        printed.missing.push(instructions)
        update.warn(`You may have ${plural ? 'dependencies' : 'a dependency'} that could be inaccessible in production`)
        update.status(null, ...instructions)
      }
    }
  }
  // Version may not be present, as a Lambda may have exited in an error state
  if (version) {
    let { runtime } = lambda.config
    let v = str => str.startsWith('v') ? str.substr(1) : str
    let getMajor = ver => ver.split('.')[0]
    let getMinor = ver => ver.split('.').slice(0, 2).join('.')
    let runtimeVer = runtimeVersions[runtime]?.wildcard
    let runtimeName
    let configured
    let local
    if (runtime.startsWith('nodejs')) {
      runtimeName = 'Node.js'
      configured = getMajor(v(runtimeVer))
      local = getMajor(v(version))
    }
    if (runtime.startsWith('python')) {
      runtimeName = 'Python'
      configured = getMinor(v(runtimeVer))
      local = getMinor(v(version))
    }
    if (runtime.startsWith('ruby')) {
      runtimeName = 'Ruby'
      configured = getMinor(v(runtimeVer))
      local = getMinor(v(version))
    }
    else return
    if (configured !== local) {
      let dir = src.replace(cwd, '')
      dir = dir[0] === sep ? dir.substr(1) : dir
      let issue = `${dir} - configured version: ${runtimeVer}, local version: ${v(version)}`
      if (printed.version.includes(issue)) return
      else {
        printed.version.push(issue)
        update.warn(`You may have a version mismatch of ${runtimeName} that could cause problems in production`)
        update.status(null, issue)
      }
    }
  }
}
