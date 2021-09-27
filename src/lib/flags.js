let flags

/**
 * Read CLI flags and populate userland options
 */
module.exports = function getFlags (useCache = true) {
  let { ARC_QUIET, QUIET, PORT } = process.env
  if (flags && useCache) return flags

  // TODO refactor all this janky custom logic into something like yargs
  let args = process.argv.slice(2)

  // Log levels
  let logLevel = 'normal'
  let findVerbose = option => [ '-v', '--verbose', 'verbose' ].includes(option)
  let findDebug =   option => [ '-d', '--debug', 'debug' ].includes(option)
  if (args.some(findVerbose)) logLevel = 'verbose'
  if (args.some(findDebug)) logLevel = 'debug'

  // Get the base port for HTTP / WebSockets; tables + events key off this
  // CLI args > env var
  let port = Number(PORT) || 3333
  let findPort = option => [ '-p', '--port', 'port' ].includes(option)
  if (args.some(findPort)) {
    let thePort = i => args[args.indexOf(i) + 1]
    if (args.includes('-p'))           port = Number(thePort('-p'))
    else if (args.includes('--port'))  port = Number(thePort('--port'))
    else if (args.includes('port'))    port = Number(thePort('port'))
    if (isNaN(port))                   port = 3333
  }

  // Quiet stdout
  let findQuiet = option => [ '-q', '--quiet', 'quiet' ].includes(option)
  let quiet = args.some(findQuiet) ||
              (ARC_QUIET !== undefined && ARC_QUIET !== 'false') ||
              (QUIET !== undefined && QUIET !== 'false')

  // Disable hydration symlinking
  // (pass undefined if not found and let default values take the wheel)
  let symlink = !args.includes('--disable-symlinks')

  return flags = {
    logLevel,
    port,
    quiet,
    symlink,
  }
}
