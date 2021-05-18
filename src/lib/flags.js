let flags

/**
 * Read CLI flags and populate userland options
 */
module.exports = function getFlags () {
  if (flags) return flags

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
  let port = Number(process.env.PORT) || 3333
  let findPort = option => [ '-p', '--port', 'port' ].includes(option)
  if (args.some(findPort)) {
    let thePort = i => args[args.indexOf(i) + 1]
    if (args.includes('-p'))           port = thePort('-p')
    else if (args.includes('--port'))  port = thePort('--port')
    else if (args.includes('port'))    port = thePort('port')
    if (isNaN(Number(port)))           port = 3333
  }

  // Quiet stdout
  let findQuiet = option => [ '-q', '--quiet', 'quiet' ].includes(option)
  let quiet = args.some(findQuiet)

  // Disable hydration symlinking
  let symlink = args.some(o => o === '--disable-symlinks') ? false : true

  return flags = {
    logLevel,
    port,
    quiet,
    symlink,
  }
}
