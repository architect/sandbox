let { updater } = require('@architect/utils')

/**
 * Warn the user if the runtime doesn't exist
 */
module.exports = function warn (runtime, pathToLambda) {
  let update = updater('Sandbox')
  let localPath = pathToLambda.replace(process.cwd(), '').substr(1)
  update.err(`${localPath} has unknown runtime: '${runtime}'`)
}
