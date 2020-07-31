let chalk = require('chalk')
let { execSync: exec } = require('child_process')
let { existsSync: exists } = require('fs')
let { join } = require('path')
let db = require('../db')
let events = require('../events')
let http = require('../http')
let hydrate = require('@architect/hydrate')
let maybeHydrate = require('../http/maybe-hydrate')
let series = require('run-series')
let create = require('@architect/create')
let {
  banner,
  chars,
  fingerprint,
  initEnv,
  portInUse,
  updater
} = require('@architect/utils')

let ports = require('./_ports')
let readArc = require('./read-arc')
let env = require('./_env')

// Assigned to database and event bus services
let httpServer
let eventBus
let dynamo

function start (params, callback) {
  params = params || {}
  let start = Date.now()
  let { port = 3333, options, version, quiet = false } = params

  // Set up quietude
  process.env.ARC_QUIET = process.env.ARC_QUIET || process.env.QUIET || quiet || '' // For when sandbox is being run outside of @arc/arc

  // Set up verbositude
  let findVerbose = option => [ '-v', '--verbose', 'verbose' ].includes(option)
  if (options && options.some(findVerbose)) {
    verbose = true
  }

  // Assigned & used later
  let update = updater('Sandbox')
  let arc
  let isDefaultProject
  let deprecated
  let verbose

  // Set up promise if there's no callback
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
     * Set up Architect ports and related env vars
     */
    function _setupPorts (callback) {
      port = ports(port, options)
      callback()
    },

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
      if (!check.filepath) {
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
      // Handle important Architect env vars and get deprecated status
      deprecated = env({ arc, port, version })

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
          update.done('Project files hydrated into functions')
          callback()
        }
      })
    },

    /**
     * Start dynalite with tables enumerated in .arc (if any)
     */
    function _db (callback) {
      if (arc.tables) {
        dynamo = db.start(function () {
          update.done('@tables created in local database')
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
        eventBus = events.start(function () {
          update.done('@events and @queues ready on local event bus')
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
        /**
         * Continually overwrite server objects
         * Reusing the same server (or keeping it in global scope) leads to very tricky state issues with routes (and their assigned functions) when stopping/(re)starting during a long-lived process
         */
        httpServer = http()
        httpServer.start(function () {
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
      if (exists(initJS))       script = initJS
      else if (exists(initPy))  script = initPy
      else if (exists(initRb))  script = initRb

      if (script) {
        update.status('Running sandbox init script')
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
              update.done(`Init (${runtime}):`)
              let print =
                result
                  .toString()
                  .trim()
                  .split('\n')
                  .map(l => `    ${l.trim()}`)
                  .join('\n')
              console.log(print)
            }
            update.done(`Sandbox init script ran in ${Date.now() - now}ms`)
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
        if (!exists(awsDir)) {
          update.warn(`Possibly found a global install of Architect without a global install of AWS-SDK, please run: npm i -g aws-sdk`)
        }
      }
      callback()
    }
  ],
  function _done (err) {
    if (err) callback(err)
    else {
      if (verbose && process.env.ARC_AWS_CREDS === 'dummy') {
        update.warn('Missing or invalid AWS credentials or credentials file, using dummy credentials (this is probably ok)')
      }
      let apiType = process.env.ARC_API_TYPE
      if (apiType && apiType === 'http' || apiType === 'httpv2') {
        update.warn('Sandbox is emulating an API Gateway v2 (HTTP) API. If this is an existing project with an API Gateway v1 (REST) API, please restart Sandbox with ARC_API_TYPE=rest')
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
    function _httpServer (callback) {
      if (arc.http || arc.ws) httpServer.close(callback)
      else callback()
    },
    function _eventBus (callback) {
      if (arc.events || arc.queues) eventBus.close(callback)
      else callback()
    },
    function _dynamo (callback) {
      if (arc.tables) dynamo.close(callback)
      else callback()
    }
  ], function closed (err) {
    if (err) callback(err)
    else callback(null, 'Sandbox successfully shut down')
  })

  return promise
}

module.exports = { start, end }
