let { exec } = require('child_process')
let { runtimeEval } = require('../../lib')
let versionCheck = require('./version-check')
let parallel = require('run-parallel')
let getVer = /\d+\.\d+.\d+/g

/**
 * Check for runtime compatibility between configured vs local versions
 * Considerations:
 * - Node adheres to semver
 * - Python + Ruby both ship breaking changes to minor
 *
 * Note: some mildly funky callback action happening here:
 * - If we're only warning, call back early and let the runtime checks finish in the background
 * - However if we're halting on error, do not call back until all checks are complete
 */
module.exports = function checkRuntimeVersions (params, callback) {
  let { cwd, inventory, restart, runtimeCheck = 'warn', update } = params
  if (restart) {
    return callback()
  }
  let { aws, lambdasBySrcDir } = inventory.inv

  // Exit early if falsy or project has no Lambdas
  if (!runtimeCheck || !lambdasBySrcDir) return callback()

  let isWarn = runtimeCheck === 'warn'
  let isError = runtimeCheck === 'error'
  if (runtimeCheck === 'warn') callback() // Continue executing in the background

  let defaultRuntime = aws.runtime
  let checks = []
  let check = runtime => {
    if (!runtime) return
    // TODO: add Deno support when we improve the Deno layer + Deno stabilizes
    if (runtime.startsWith('node'))   checks.push('node')
    if (runtime.startsWith('python')) checks.push('python')
    if (runtime.startsWith('ruby'))   checks.push('ruby')
  }
  check(defaultRuntime)
  // ASAP shouldn't appear in lambdasBySrcDir but check jic
  Object.values(lambdasBySrcDir).forEach(lambda => {
    // Multi-tenant Lambda check
    if (Array.isArray(lambda)) lambda = lambda[0]
    if (!lambda.arcStaticAssetProxy) check(lambda.config.runtime)
  })

  let counts = { node: 0, python: 0, ruby: 0 }
  checks.forEach(c => counts[c]++)
  checks = [ ...new Set(checks) ].sort()
  if (!checks.length) return

  let localRuntimes = {}
  parallel(checks.map(runtime => {
    return callback => {
      let { command } = runtimeEval[runtime]()
      if (command === ' ') command += 'node'
      let cmd = `${command} --version`
      exec(cmd, (err, result) => {
        if (err) callback(runtime)
        else {
          localRuntimes[runtime] = result.match(getVer)[0]
          callback()
        }
      })
    }
  }), function (err) {
    if (err) {
      let name = err[0].toUpperCase() + err.substr(1)
      if (err === 'node') name += '.js'
      let plural = counts[err] > 1 ? 's' : ''
      let msg = `Sandbox was unable to find or execute ${name}, used in ${counts[err]} Lambda${plural}`
      if (isWarn) update.warn(msg)
      if (isError) return callback(Error(msg))
    }
    let notOk = versionCheck({ cwd, inventory, localRuntimes })
    if (notOk && isWarn) {
      update.warn(notOk[0])
      update.status(null, ...notOk.slice(1))
    }
    if (notOk && isError) {
      callback(Error(notOk.join('\n')))
    }
    else if (isError) callback()
  })
}
