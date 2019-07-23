let chalk = require('chalk')
let db = require('./db')
let events = require('./events')
let http = require('./http')
let hydrate = require('@architect/hydrate')
let maybeHydrate = require('./http/maybe-hydrate')
let series = require('run-series')
let utils = require('@architect/utils')
let chars = utils.chars

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
    /**
     * Make sure we have access to the desired port
     */
    function _checkPort(callback) {
      utils.portInUse(port, callback)
    },

    /**
     * Ensure there's an Architect project manifest present
     */
    function _checkArc(callback) {
      try {
        arc = utils.readArc().arc
        callback()
      }
      catch(e) {
        let msg = chalk.white(chalk.red.bold('Sandbox error!'), 'No Architect manifest found, cannot start')
        callback(msg)
      }
    },

    /**
     * Print the banner (which also loads some boostrap env vars)
     */
    function _printBanner(callback) {
      utils.banner(params)
      let msg = chalk.grey(chars.done, 'Found Architect manifest, starting up')
      console.log(msg)
      callback()
    },

    /**
     * Populate additional environment variables
     */
    function _env(callback) {
      process.env.SESSION_TABLE_NAME = 'jwe'
      if (!process.env.NODE_ENV) {
        process.env.NODE_ENV = 'testing'
      }
      utils.populateEnv(callback)
    },

    /**
     * Check to see if @static fingerprint is enabled, and maybe generate public/static.json
     */
    function _maybeWriteStaticManifest(callback) {
      let {static} = arc
      if (!static) {
        callback()
      }
      else {
        utils.fingerprint({}, function next(err, result) {
          if (err) callback(err)
          else {
            if (result) {
              console.log(chars.done, chalk.grey(`Static asset fingerpringing enabled, public/static.json generated`))
            }
            callback()
          }
        })
      }
    },

    /**
     * Loop through functions and see if any need dependency hydration
     */
    function _maybeHydrate(callback) {
      maybeHydrate(callback)
    },

    /**
     * ... then hydrate Architect project files into functions
     */
    function _hydrateShared(callback) {
      hydrate({install: false}, function next(err) {
        if (err) callback(err)
        else {
          let msg = chalk.grey(chars.done, 'Project files hydrated into functions')
          console.log(msg)
          callback()
        }
      })
    },

    /**
     * Start dynalite with tables enumerated in .arc (if any)
     */
    function _db(callback) {
      client = db.start(function() {
        let msg = chalk.grey(chars.done, '@tables created in local database')
        console.log(msg)
        callback()
      })
    },

    /**
     * Start event bus to listen for arc.event.publish events on 3334
     */
    function _events(callback) {
      bus = events.start(function() {
        let msg = chalk.grey(chars.done, '@events and @queues ready on local event bus')
        console.log(msg)
        callback()
      })
    },

    /**
     * Start http server with routes enumerated in .arc (if any)
     */
    function _http(callback) {
      let ok = () => {
        let end = Date.now()
        let startMsg = chalk.grey(`Sandbox started in ${end - start}ms`)
        console.log(`\n${chars.done} ${startMsg}`)

        let isWin = process.platform.startsWith('win')
        let ready = isWin
          ? chars.done
          : chalk.green.dim('✈︎')
        let readyMsg = chalk.white('Local environment ready!')
        console.log(`${ready} ${readyMsg}`)
      }
      if (arc.http) {
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
      /**
       * Finally, pass a function to shut everything down if this is being used as a module
       */
      callback(null, end)
    }
  })

  return promise
}

