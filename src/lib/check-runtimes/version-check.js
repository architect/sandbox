let { sep } = require('path')
let { aliases, runtimeVersions, runtimes } = require('lambda-runtimes')

/**
 * Runtime version compatibility checker
 * tl;drs:
 * - Node.js: almost always backwards compatible; breaking changes would ship in semver major
 *   - https://github.com/nodejs/Release & https://nodesource.com/blog/understanding-how-node-js-release-lines-work/
 * - Ruby: ships breaking changes on semver minor
 *   - https://www.ruby-lang.org/en/news/2013/12/21/ruby-version-policy-changes-with-2-1-0/
 * - Python: may ship breaking changes on semver minor
 *   - https://devguide.python.org/devcycle/
 */
module.exports = function runtimeVersionCheck (params) {
  let { cwd, inventory, localRuntimes } = params
  let issues = []

  let { aws, lambdasBySrcDir } = inventory.inv
  let defaultRuntime = aws.runtime

  // Parse default runtime
  if (defaultRuntime) {
    let { ok, local, runtime } = check(defaultRuntime, localRuntimes)
    if (!ok) {
      let issue = `Project global runtime - configured version: ${runtime}, local version: ${local}`
      issues.push(issue)
    }
  }

  Object.values(lambdasBySrcDir).forEach(lambda => {
    // Multi-tenant Lambda check
    if (Array.isArray(lambda)) lambda = lambda[0]
    let { arcStaticAssetProxy, config, src } = lambda
    if (arcStaticAssetProxy) return
    let { ok, local, runtime } = check(config.runtime, localRuntimes)
    let isGloballyConfigured = config.runtimeAlias === defaultRuntime
    if (!ok && !isGloballyConfigured) {
      let dir = src.replace(cwd, '')
      dir = dir[0] === sep ? dir.substr(1) : dir
      let issue = `${dir} - configured version: ${runtime}, local version: ${local}`
      issues.push(issue)
    }
  })
  if (issues.length) {
    let plural = issues.length > 1
    issues.unshift(`You have ${plural ? '' : 'a '}runtime version mismatch${plural ? 'es' : ''} that could cause problems in production:`)
    return issues
  }
  return
}

function check (configured, localRuntimes) {
  let alias = aliases[configured.toLowerCase()]
  let runtime = alias ? runtimes[alias][0] : configured
  let major = ver => ver.split('.')[0]
  let minor = ver => ver.split('.')[1]
  if (runtime.startsWith('nodejs')) {
    let runtimeVer = runtimeVersions[runtime].wildcard
    let local = localRuntimes.node
    return {
      local,
      ok: major(runtimeVer) <= major(local),
      runtime: alias ? `${runtime} (aliased to ${configured})` : runtime
    }
  }
  if (runtime.startsWith('python')) {
    let runtimeVer = runtimeVersions[runtime].wildcard
    let local = localRuntimes.python
    return {
      local,
      ok: major(runtimeVer) === major(local) &&
          minor(runtimeVer) === minor(local),
      runtime: alias ? `${runtime} (aliased to ${configured})` : runtime
    }
  }
  if (runtime.startsWith('ruby')) {
    let runtimeVer = runtimeVersions[runtime].wildcard
    let local = localRuntimes.ruby
    return {
      local,
      ok: major(runtimeVer) === major(local) &&
          minor(runtimeVer) === minor(local),
      runtime: alias ? `${runtime} (aliased to ${configured})` : runtime,
    }
  }
  else return { ok: true }
}
