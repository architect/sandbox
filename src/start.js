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
        callback(chalk.white(chalk.red.bold('Error!'), 'No Architect project found'))
      }
    },
    function _printBanner(callback) {
      utils.banner(params)
      callback()
    },
    function _hydrate(callback) {
      hydrate({install: false}, callback)
    },
    function _env(callback) {
      // populates additional environment variables
      process.env.SESSION_TABLE_NAME = 'jwe'
      if (!process.env.hasOwnProperty('NODE_ENV'))
        process.env.NODE_ENV = 'testing'
      utils.populateEnv(callback)
    },
    function _db(callback) {
      // start dynalite with tables enumerated in .arc
      client = db.start(function() {
        let start = chalk.grey(chalk.green.dim('✓'), '@tables created in local database')
        console.log(`${start}`)
        callback()
      })
    },
    function _events(callback) {
      // listens for arc.event.publish events on 3334 and runs them in a child process
      bus = events.start(function() {
        let start = chalk.grey(chalk.green.dim('✓'), '@events and @queues ready on local event bus')
        console.log(`${start}`)
        callback()
      })
    },
    function _http(callback) {
      // vanilla af http server that mounts routes defined by .arc
      http.start(function() {
        let start = chalk.grey('\n', 'Started HTTP "server" @ ')
        let end = chalk.cyan.underline(`http://localhost:${port}`)
        console.log(`${start} ${end}`)
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

