let series = require('run-series')
let chalk = require('chalk')
let db = require('./db')
let events = require('./events')
let http = require('./http')
let utils = require('@architect/utils')
let hydrate = require('@architect/hydrate')

module.exports = function start(params, callback) {
  // Set up default sandbox port
  process.env.PORT = process.env.PORT || params && params.port || 3333
  let port = process.env.PORT

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
    // hulk smash
    function _checkPort(callback) {
      utils.portInUse(port, callback)
    },
    function _checkArc(callback) {
      try {
        utils.readArc()
        callback()
      }
      catch(e) {
        let msg = chalk.white(chalk.red.bold('Sandbox error!'), 'No Architect manifest found, cannot start')
        callback(msg)
      }
    },
    function _printBanner(callback) {
      utils.banner(params)
      let msg = chalk.grey(chalk.green.dim('✓'), 'Found Architect manifest, starting up')
      console.log(msg)
      callback()
    },
    function _env(callback) {
      // populates additional environment variables
      process.env.SESSION_TABLE_NAME = 'jwe'
      if (!process.env.hasOwnProperty('NODE_ENV'))
        process.env.NODE_ENV = 'testing'
      utils.populateEnv(callback)
    },
    function _hydrate(callback) {
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
      // start dynalite with tables enumerated in .arc
      client = db.start(function() {
        let msg = chalk.grey(chalk.green.dim('✓'), '@tables created in local database')
        console.log(msg)
        callback()
      })
    },
    function _events(callback) {
      // listens for arc.event.publish events on 3334 and runs them in a child process
      bus = events.start(function() {
        let msg = chalk.grey(chalk.green.dim('✓'), '@events and @queues ready on local event bus')
        console.log(msg)
        callback()
      })
    },
    function _http(callback) {
      // vanilla af http server that mounts routes defined by .arc
      http.start(function() {
        let msg = chalk.grey('\n', 'Started HTTP "server" @ ')
        let info = chalk.cyan.underline(`http://localhost:${port}`)
        console.log(`${msg} ${info}`)
        callback()
      })
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
      // pass a function to shut everything down if this is being used as a module
      callback(null, end)
    }
  })

  return promise
}

