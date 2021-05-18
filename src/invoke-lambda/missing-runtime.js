/**
 * Warn the user if the runtime doesn't exist
 */
module.exports = function warn ({ runtime, src, update }) {
  let localPath = src.replace(process.cwd(), '').substr(1)
  update.err(`${localPath} has unknown runtime: '${runtime}'`)
}
