let chalk = require('chalk')
let exec = require('child_process').execSync
let exists = require('fs').existsSync
let join = require('path').join
let db = require('./db')
let events = require('./events')
let http = require('./http')
let hydrate = require('@architect/hydrate')
let maybeHydrate = require('./http/maybe-hydrate')
let series = require('run-series')
let create = require('@architect/create')
let {banner, chars, fingerprint, initEnv,
     portInUse, readArc, updater} = require('@architect/utils')
let quiet = process.env.QUIET

module.exports = function start(params={}, callback) {
  let start = Date.now()
  let {port, options, version} = params
  let update = updater('Sandbox')
  let arc
  let deprecated
  let verbose
  /**
   * Set up default sandbox port
   * CLI args > env var > passed arg
   */
  let findPort = option => ['-p', '--port', 'port'].includes(option)
  if (options && options.some(findPort)) {
    let thePort = i => options[options.indexOf(i) + 1] || 3333
    if (options.includes('-p'))
      process.env.PORT = thePort('-p')
    else if (options.includes('--port'))
      process.env.PORT = thePort('--port')
    else if (options.includes('port'))
      process.env.PORT = thePort('port')
  }
  process.env.PORT = process.env.PORT || port || 3333
  port = process.env.PORT

  let findVerbose = option => ['-v', '--verbose', 'verbose'].includes(option)
  if (options && options.some(findVerbose)) {
    verbose = true
  }

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
      portInUse(port, callback)
    },

    /**
     * Ensure there's an Architect project manifest present
     */
    function _checkArc(callback) {
      try {
        arc = readArc().arc
        callback()
      }
      catch(e) {
        let msg = chalk.white(chalk.red.bold('Sandbox error!'), e.message)
        callback(msg)
      }
    },

    /**
     * Print the banner (which also loads some boostrap env vars)
     */
    function _printBanner(callback) {
      banner(params)
      if (!quiet) {
        update.done('Found Architect manifest, starting up')
      }
      callback()
    },

    /**
     * Populate additional environment variables
     */
    function _env(callback) {
      if (!process.env.NODE_ENV)
        process.env.NODE_ENV = 'testing'
      // Set Arc 5 / 6+ env
      if (version && version.startsWith('Architect 5')) {
        process.env.DEPRECATED = true
        deprecated = process.env.DEPRECATED
        process.env.ARC_HTTP = 'aws'
      }
      else process.env.ARC_HTTP = 'aws_proxy'
      // Read .arc-env
      initEnv(callback)
      // Populate session table (if not present)
      if (!process.env.SESSION_TABLE_NAME)
        process.env.SESSION_TABLE_NAME = 'jwe' // Default
      // Declare a bucket for implicit proxy
      process.env.ARC_STATIC_BUCKET = 'sandbox'
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
        fingerprint({}, function next(err, result) {
          if (err) callback(err)
          else {
            if (result) {
              update.done('Static asset fingerpringing enabled, public/static.json generated')
            }
            callback()
          }
        })
      }
    },

    /**
     * Always initialize any missing functions on startup
     */
    function _maybeInit(callback) {
      if (!deprecated) {
        create({}, callback)
      }
      else callback()
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
          if (!quiet) {
            update.done('Project files hydrated into functions')
          }
          callback()
        }
      })
    },

    /**
     * Start dynalite with tables enumerated in .arc (if any)
     */
    function _db(callback) {
      client = db.start(function() {
        if (arc.tables) {
          update.done('@tables created in local database')
        }
        callback()
      })
    },

    /**
     * Start event bus to listen for arc.event.publish events on 3334
     */
    function _events(callback) {
      bus = events.start(function() {
        if (arc.events || arc.queues) {
          update.done('@events and @queues ready on local event bus')
        }
        callback()
      })
    },

    /**
     * Start http server with routes enumerated in .arc (if any)
     */
    function _http(callback) {
      let ok = () => {
        let end = Date.now()
        console.log()
        update.done(`Sandbox started in ${end - start}ms`)
        if (!quiet) {
          let isWin = process.platform.startsWith('win')
          let ready = isWin
            ? chars.done
            : chalk.green.dim('✈︎')
          let readyMsg = chalk.white('Local environment ready!')
          console.log(`${ready} ${readyMsg}`)
        }
      }
      // Arc 5 only starts if it's got actual routes to load
      let arc5 = deprecated && arc.http && arc.http.length
      // Arc 6 may start with proxy at root, or empty `@http` pragma
      let arc6 = !deprecated && arc.static || arc.http
      if (arc5 || arc6) {
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
    },

    /**
     * Run init script (if present)
     */
    function _runInit(callback) {
      let initJS = join(process.cwd(), 'scripts', 'sandbox-startup.js')
      let initPy = join(process.cwd(), 'scripts', 'sandbox-startup.py')
      let initRb = join(process.cwd(), 'scripts', 'sandbox-startup.rb')
      let script
      if (exists(initJS))
        script = initJS
      else if (exists(initPy))
        script = initPy
      else if (exists(initRb))
        script = initRb
      if (script) {
        let now = Date.now()
        update.status('Running sandbox init script')
        let run
        let runtime
        if (script === initJS) {
          // eslint-disable-next-line
          let js = require(script)
          run = js(arc)
          runtime = 'Node.js'
        }
        else if (script === initPy) {
          run = exec(`python ${initPy}`)
          runtime = 'Python'
        }
        else {
          run = exec(`ruby ${initRb}`)
          runtime = 'Ruby'
        }
        Promise.resolve(run).then(
          function done(result) {
            if (result) {
              update.done(`Init (${runtime}):`)
              let print = result.toString().trim().split('\n').map(l => `    ${l.trim()}`).join('\n')
              console.log(print)
            }
            update.done(`Sandbox init script ran in ${Date.now() - now}ms`)
            callback()
          }
        )
      }
      else callback()
    }
  ],
  function _done(err) {
    if (err) callback(err)
    else {
      if (verbose && process.env.ARC_AWS_CREDS === 'dummy') {
        update.warn('Missing or invalid AWS credentials or credentials file, using dummy credentials (this is probably ok)')
      }
      function end() {
        client.close()
        bus.close()
        if (arc.http || arc.ws)
          http.close()
      }
      /**
       * Finally, pass a function to shut everything down if this is being used as a module
       */
      callback(null, end)
    }
  })

  return promise
}
