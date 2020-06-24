let chalk = require('chalk')
let exec = require('child_process').execSync
let exists = require('fs').existsSync
let join = require('path').join
let db = require('../db')
let events = require('../events')
let http = require('../http')
let hydrate = require('@architect/hydrate')
let maybeHydrate = require('../http/maybe-hydrate')
let series = require('run-series')
let create = require('@architect/create')
let { banner, chars, fingerprint, initEnv,
  portInUse, toLogicalID, updater } = require('@architect/utils')
let readArc = require('./read-arc')

let client
let bus

function start (params, callback) {
  params = params || {}
  let start = Date.now()
  let { port = 3333, options, version, quiet = false } = params
  let update = updater('Sandbox')
  let arc
  let isDefaultProject
  let deprecated
  let verbose

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
  port = process.env.PORT = Number(process.env.PORT) || port

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

  // Set up quietude
  quiet = process.env.ARC_QUIET || process.env.QUIET || quiet
  process.env.ARC_QUIET = quiet || '' // For when sandbox is being run outside of @arc/arc

  // Set up verbositude
  let findVerbose = option => [ '-v', '--verbose', 'verbose' ].includes(option)
  if (options && options.some(findVerbose)) {
    verbose = true
  }

  // Set up promise if there is no callback
  let promise
  if (!callback) {
    promise = new Promise(function (res, rej) {
      callback = function (err, result) {
        err ? rej(err) : res(result)
      }
    })
  }

  series([
    /**
     * Make sure we have access to the desired HTTP port
     */
    function _checkPort (callback) {
      portInUse(port, callback)
    },

    /**
     * Print the banner (which also loads some boostrap env vars)
     */
    function _printBanner (callback) {
      banner(params)
      callback()
    },

    /**
     * Read the current Architect project (or use a default project)
     */
    function _checkArc (callback) {
      let check = readArc()
      arc = check.arc
      if (!quiet && !check.filepath) {
        update.warn('No Architect project manifest found, using default project')
      }
      else {
        update.done('Found Architect project manifest, starting up')
      }
      isDefaultProject = check.isDefaultProject ? true : false
      callback()
    },

    /**
     * Populate additional environment variables
     */
    function _env (callback) {
      /**
       * Ensure env is one of: 'testing', 'staging', or 'production'
       * - By default, set (or override) to 'testing'
       * - Some test harnesses (ahem) will automatically populate NODE_ENV with their own values, unbidden
       */
      let env = process.env.NODE_ENV
      let isNotStagingOrProd = env !== 'staging' && env !== 'production'
      if (!env || isNotStagingOrProd) {
        process.env.NODE_ENV = 'testing'
      }

      // Set Arc 5 / 6+ Lambda config env
      if (version && version.startsWith('Architect 5') || process.env.DEPRECATED) {
        deprecated = process.env.DEPRECATED = true
        process.env.ARC_HTTP = 'aws'
      }
      else {
        process.env.ARC_HTTP = 'aws_proxy'
        if (env === 'staging' ||
            env === 'production') {
          let capEnv = env.charAt(0).toUpperCase() + env.substr(1)
          process.env.ARC_CLOUDFORMATION = `${toLogicalID(arc.app[0])}${capEnv}`
        }
        let spaSetting = tuple => tuple[0] === 'spa'
        // findIndex instead of find so we don't mix up bools
        let spa = arc.static && arc.static.some(spaSetting) && arc.static.findIndex(spaSetting)
        let spaIsValid = arc.static && arc.static[spa] && typeof arc.static[spa][1] === 'boolean'
        if (spaIsValid) process.env.ARC_STATIC_SPA = arc.static[spa][1]
      }

      // Populate session table (if not present)
      if (!process.env.SESSION_TABLE_NAME) {
        process.env.SESSION_TABLE_NAME = 'jwe'
      }

      // Declare a bucket for implicit proxy
      process.env.ARC_STATIC_BUCKET = 'sandbox'

      // Set default WebSocket URL
      process.env.ARC_WSS_URL = `ws://localhost:${port}`

      // Read .arc-env
      initEnv(callback)
    },

    /**
     * Check to see if @static fingerprint is enabled, and maybe generate public/static.json
     */
    function _maybeWriteStaticManifest (callback) {
      if (!arc.static || isDefaultProject) {
        callback()
      }
      else {
        fingerprint({}, function next (err, result) {
          if (err) callback(err)
          else {
            if (result && !quiet) {
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
    function _maybeInit (callback) {
      if (!deprecated) {
        create({}, callback)
      }
      else callback()
    },

    /**
     * Loop through functions and see if any need dependency hydration
     */
    function _maybeHydrate (callback) {
      maybeHydrate(callback)
    },

    /**
     * ... then hydrate Architect project files into functions
     */
    function _hydrateShared (callback) {
      hydrate({ install: false }, function next (err) {
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
    function _db (callback) {
      if (arc.tables) {
        client = db.start(function () {
          if (!quiet) {
            update.done('@tables created in local database')
          }
          callback()
        })
      }
      else callback()
    },

    /**
     * Start event bus to listen for arc.event.publish events
     */
    function _events (callback) {
      if (arc.events || arc.queues) {
        bus = events.start(function () {
          if (!quiet) {
            update.done('@events and @queues ready on local event bus')
          }
          callback()
        })
      }
      else callback()
    },

    /**
     * Start http server with routes enumerated in .arc (if any)
     */
    function _http (callback) {
      let ok = () => {
        let finish = Date.now()
        if (!quiet) {
          console.log()
          update.done(`Started in ${finish - start}ms`)
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
        http.start(function () {
          ok()
          if (!quiet) {
            let link = chalk.green.bold.underline(`http://localhost:${port}\n`)
            console.log(`\n    ${link}`)
          }
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
    function _runInit (callback) {
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
        if (!quiet) {
          update.status('Running sandbox init script')
        }
        let now = Date.now()
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
          function done (result) {
            if (result) {
              if (!quiet) {
                update.done(`Init (${runtime}):`)
              }
              let print =
                result
                  .toString()
                  .trim()
                  .split('\n')
                  .map(l => `    ${l.trim()}`)
                  .join('\n')
              console.log(print)
            }
            if (!quiet) {
              update.done(`Sandbox init script ran in ${Date.now() - now}ms`)
            }
            callback()
          }
        )
      }
      else callback()
    },

    /**
     * Check aws-sdk installation status if installed globally
     */
    function _checkAWS_SDK (callback) {
      let cwd = process.cwd()
      let dir = __dirname
      if (!dir.startsWith(cwd)) {
        let awsDir = join(__dirname.split('@architect')[0], 'aws-sdk', 'package.json')
        if (!exists(awsDir) && !quiet) {
          update.warn(`Possibly found a global install of Architect without a global install of AWS-SDK, please run: npm i -g aws-sdk`)
        }
      }
      callback()
    }
  ],
  function _done (err) {
    if (err) callback(err)
    else {
      if (verbose && process.env.ARC_AWS_CREDS === 'dummy' && !quiet) {
        update.warn('Missing or invalid AWS credentials or credentials file, using dummy credentials (this is probably ok)')
      }
      /**
       * Finally, pass a function to shut everything down if this is being used as a module
       */
      callback(null, end)
    }
  })

  return promise
}

function end (callback) {
  // Set up promise if there is no callback
  let promise
  if (!callback) {
    promise = new Promise(function (res, rej) {
      callback = function (err, result) {
        err ? rej(err) : res(result)
      }
    })
  }
  // Read .arc again in case the state changed during the course of usage
  let { arc } = readArc()
  series([
    function _client (callback) {
      if (arc.tables) client.close(callback)
      else callback()
    },
    function _bus (callback) {
      if (arc.events || arc.queues) bus.close(callback)
      else callback()
    },
    function _http (callback) {
      if (arc.http || arc.ws) http.close(callback)
      else callback()
    }
  ], function closed (err) {
    if (err) callback(err)
    else callback(null, 'Sandbox successfully shut down')
  })

  return promise
}

module.exports = { start, end }
