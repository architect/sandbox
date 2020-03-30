let { updater } = require('@architect/utils')

/**
 * Warn the user if node has resolved a dependency outside their function's folder
 */
module.exports = function warn (missing=[], pathToLambda) {
  if (missing.length) {
    // Remove AWS-SDK, that's bundled in Lambda
    let awsSdk = missing.findIndex(dep => dep === 'aws-sdk')
    if (awsSdk >= 0) {
      missing.splice(awsSdk, 1)
    }
    // Do we still have anything left?
    if (missing.length) {
      let update = updater('Sandbox')
      let plural = missing.length > 1
      pathToLambda = pathToLambda.replace(process.cwd(), '').substr(1)

      update.warn(`Your function may have ${plural ? 'dependencies' : 'a dependency'} that could be inaccessible in production`)
      missing = missing.map(dep => `Please run: cd ${pathToLambda} && npm i ${dep}`)
      update.status(null, ...missing)
    }
  }
}
