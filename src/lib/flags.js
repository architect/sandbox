let minimist = require('minimist')
let flags

/**
 * Read CLI flags and populate userland options
 */
module.exports = function getFlags (useCache = true) {
  let { ARC_QUIET, QUIET, PORT } = process.env

  let alias = {
    debug: [ 'd' ],
    port: [ 'p' ],
    quiet: [ 'q' ],
    verbose: [ 'v' ],
  }
  let boolean = [ 'disable-symlinks' ]
  let args = minimist(process.argv.slice(2), { alias, boolean })
  if (flags && useCache) return flags

  // Log levels
  // TODO [REMOVE]: remove support for bare verbose + debug flags
  let logLevel = 'normal'
  let verbose = 'verbose'
  let debug = 'debug'
  if (args.verbose || args._.includes(verbose)) logLevel = verbose
  if (args.debug || args._.includes(debug)) logLevel = debug

  // Get the base port for HTTP / WebSockets; tables + events key off this
  // CLI args > env var
  let port = Number(PORT) || args.port || 3333
  if (isNaN(port)) port = 3333

  // Quiet stdout
  // TODO [REMOVE]: remove support for bare quiet flag
  let quiet = args.quiet || args._.includes('quiet') ||
              (ARC_QUIET !== undefined && ARC_QUIET !== 'false') ||
              (QUIET !== undefined && QUIET !== 'false')

  // Disable hydration symlinking
  // (pass undefined if not found and let default values take the wheel)
  let symlink = !args['disable-symlinks']

  return flags = {
    logLevel,
    port,
    quiet,
    symlink,
  }
}
