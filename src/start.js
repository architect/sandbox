let chalk = require('chalk')
let db = require('./db')
let events = require('./events')
let http = require('./http')
let hydrate = require('@architect/hydrate')
let maybeHydrate = require('./http/maybe-hydrate')
let series = require('run-series')
let utils = require('@architect/utils')

module.exports = function start(params, callback) {
  let start = Date.now()
  params = params || {}
  let {port, options} = params
  let arc
  /**
   * Set up default sandbox port
   * CLI args > env var > passed arg
   */
  let findPort = option => option === '-p' || option === '--port' || option === 'port'
  if (options && options.some(findPort)) {
    if (options.indexOf('-p') >= 0)
      process.env.PORT = options[options.indexOf('-p') + 1]
    if (options.indexOf('--port') >= 0)
      process.env.PORT = options[options.indexOf('--port') + 1]
    if (options.indexOf('port') >= 0)
      process.env.PORT = options[options.indexOf('port') + 1]
  }
  process.env.PORT = process.env.PORT || port || 3333
  port = process.env.PORT

  // Set up promise if there is no callback
  let promise
  if (!callback) {
    promise = new Promise(function(res, rej) {
      callback = function(err, result) {
        err ? rej(err) : res(result)
      }
    })
  }

  let client
  let bus
  series([
    function _checkPort(callback) {
      // Make sure we have access to the desired port
      utils.portInUse(port, callback)
    },
    function _checkArc(callback) {
      // Ensure there's an Architect project manifest present
      try {
        arc = utils.readArc().arc
        callback()
      }
      catch(e) {
        let msg = chalk.white(chalk.red.bold('Sandbox error!'), 'No Architect manifest found, cannot start')
        callback(msg)
      }
    },
    function _printBanner(callback) {
      // Print the banner (which also loads some boostrap env vars)
      utils.banner(params)
      let msg = chalk.grey(chalk.green.dim('✓'), 'Found Architect manifest, starting up')
      console.log(msg)
      callback()
    },
    function _env(callback) {
      // Populates additional environment variables
      process.env.SESSION_TABLE_NAME = 'jwe'
      if (!process.env.NODE_ENV) {
        process.env.NODE_ENV = 'testing'
      }
      utils.populateEnv(callback)
    },
    function _maybeHydrate(callback) {
      // Loop through functions and see if any need dependency hydration
      maybeHydrate(callback)
    },
    function _hydrateShared(callback) {
      // ... then hydrate in Architect project files
      hydrate({install: false}, function next(err) {
        if (err) callback(err)
        else {
          let msg = chalk.grey(chalk.green.dim('✓'), 'Project files hydrated into functions')
          console.log(msg)
          callback()
        }
      })
    },
    function _db(callback) {
      // Start dynalite with tables enumerated in .arc
      client = db.start(function() {
        let msg = chalk.grey(chalk.green.dim('✓'), '@tables created in local database')
        console.log(msg)
        callback()
      })
    },
    function _events(callback) {
      // Listens for arc.event.publish events on 3334 and runs them in a child process
      bus = events.start(function() {
        let msg = chalk.grey(chalk.green.dim('✓'), '@events and @queues ready on local event bus')
        console.log(msg)
        callback()
      })
    },
    function _http(callback) {
      let ok = () => {
        let end = Date.now()
        let startIndicator = chalk.green.dim('✓')
        let startMsg = chalk.grey(`Sandbox started in ${end - start}ms`)
        console.log(`\n${startIndicator} ${startMsg}`)

        let readyIndicator = chalk.green.dim('✈︎')
        let readyMsg = chalk.white('Local environment ready!')
        console.log(`${readyIndicator} ${readyMsg}`)
      }
      if (arc.http) {
        // Vanilla af http server that mounts routes defined by .arc
        http.start(function() {
          ok()
          let link = chalk.green.bold.underline(`http://localhost:${port}\n`)
          console.log(`\n    ${link}`)
          callback()
        })
      }
      else {
        ok()
        callback()
      }
    }
  ],
  function _done(err) {
    if (err) callback(err)
    else {
      function end() {
        client.close()
        http.close()
        bus.close()
      }
      // Pass a function to shut everything down if this is being used as a module
      callback(null, end)
    }
  })

  return promise
}

