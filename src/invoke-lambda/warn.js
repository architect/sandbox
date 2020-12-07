let { updater } = require('@architect/utils')

/**
 * Warn the user if node has resolved a dependency outside their function's folder
 */
module.exports = function warn (missing = []) {
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

      update.warn(`Your function may have ${plural ? 'dependencies' : 'a dependency'} that could be inaccessible in production`)
      let msg = `Please run: npm i ${missing.join(' ')}`
      update.status(null, msg)
    }
  }
}
