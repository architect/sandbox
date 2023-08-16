let minimist = require('minimist')

/**
 * Read CLI flags and populate userland options
 */
module.exports = function getFlags () {
  let { ARC_QUIET, QUIET, ARC_HOST } = process.env

  let alias = {
    debug: [ 'd' ],
    port: [ 'p' ],
    host: [ 'h' ],
    quiet: [ 'q' ],
    verbose: [ 'v' ],
  }
  let boolean = [ 'disable-delete-vendor', 'disable-symlinks' ]
  let args = minimist(process.argv.slice(2), { alias, boolean })

  // Log levels (defaults to `normal` in the updater)
  let logLevel
  if (args.verbose) logLevel = 'verbose'
  if (args.debug) logLevel = 'debug'

  // Disable node_modules / vendor dir deletion upon startup
  let deleteVendor = !args['disable-delete-vendor']

  // Main user-facing @http port
  let port = Number(args.port) || undefined

  // Host setting the server listens on
  // Node.js 17+ changed DNS lookup behavior for host binding, which may unpredictably bind to IPv6 loopback (::1) instead of IPv4 (127.0.0.1)
  // Host must be undefined unless manually specified
  // See: https://github.com/nodejs/node/pull/39987
  let host = args.host || ARC_HOST || undefined

  // Quiet stdout
  let quiet = args.quiet || (ARC_QUIET && ARC_QUIET !== 'false') || (QUIET && QUIET !== 'false') || false

  // Disable hydration symlinking
  // (pass undefined if not found and let default values take the wheel)
  let symlink = !args['disable-symlinks']

  let flags = {
    deleteVendor,
    port,
    host,
    quiet,
    symlink,
  }
  if (logLevel) flags.logLevel = logLevel
  return flags
}
