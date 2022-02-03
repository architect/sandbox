let minimist = require('minimist')

/**
 * Read CLI flags and populate userland options
 */
module.exports = function getFlags () {
  let { ARC_QUIET, QUIET } = process.env

  let alias = {
    debug: [ 'd' ],
    port: [ 'p' ],
    quiet: [ 'q' ],
    verbose: [ 'v' ],
  }
  let boolean = [ 'disable-symlinks' ]
  let args = minimist(process.argv.slice(2), { alias, boolean })

  // Log levels (defaults to `normal` in the updater)
  let logLevel
  if (args.verbose) logLevel = 'verbose'
  if (args.debug) logLevel = 'debug'

  // Main user-facing @http port
  let port = Number(args.port) || undefined

  // Quiet stdout
  let quiet = args.quiet || (ARC_QUIET && ARC_QUIET !== 'false') || (QUIET && QUIET !== 'false') || false

  // Disable hydration symlinking
  // (pass undefined if not found and let default values take the wheel)
  let symlink = !args['disable-symlinks']

  let flags = {
    port,
    quiet,
    symlink,
  }
  if (logLevel) flags.logLevel = logLevel
  return flags
}
