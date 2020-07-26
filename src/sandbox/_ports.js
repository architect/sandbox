module.exports = function ports (port, options) {
  /**
   * Set up Sandbox ports
   * CLI args > env var > passed arg
   */
  let findPort = option => [ '-p', '--port', 'port' ].includes(option)
  if (options && options.some(findPort)) {
    let thePort = i => options[options.indexOf(i) + 1] || port
    if (options.includes('-p'))
      process.env.PORT = thePort('-p')
    else if (options.includes('--port'))
      process.env.PORT = thePort('--port')
    else if (options.includes('port'))
      process.env.PORT = thePort('port')
  }
  process.env.PORT = Number(process.env.PORT) || port

  // Validate
  let notNum = e => e && isNaN(e)
  if (notNum(process.env.ARC_EVENTS_PORT) ||
      notNum(process.env.ARC_TABLES_PORT) ||
      notNum(port)) {
    throw ReferenceError('Ports must be numbers')
  }

  // Set non-conflicting ports for running multiple simultaneous Architect projects
  if (port !== 3333 && !process.env.ARC_EVENTS_PORT) {
    process.env.ARC_EVENTS_PORT = port + 1
  }
  if (port !== 3333 && !process.env.ARC_TABLES_PORT) {
    process.env.ARC_TABLES_PORT = port + 2
  }

  return process.env.PORT
}
