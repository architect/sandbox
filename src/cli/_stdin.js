let { emitKeypressEvents } = require('readline')
let sandbox = require('../')
let { processes } = require('../invoke-lambda/exec/spawn')
let kill = require('tree-kill')
let parallel = require('run-parallel')

module.exports = function handleStdin (params) {
  let { rehydrate, update, watcher } = params

  // Listen for important keystrokes
  emitKeypressEvents(process.stdin)
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true)
  }
  process.stdin.on('keypress', function now (input, key) {
    if (input === 'H') {
      rehydrate({
        timer: 'rehydrateAll',
        msg: 'Rehydrating all shared files...',
        force: true
      })
    }
    if (input === 'S') {
      rehydrate({
        timer: 'rehydrateShared',
        only: 'shared',
        msg: 'Rehydrating src/shared...',
        force: true
      })
    }
    if (input === 'V') {
      rehydrate({
        timer: 'rehydrateViews',
        only: 'views',
        msg: 'Rehydrating src/views...',
        force: true
      })
    }
    if (key.sequence === '\u0003' || key.sequence === '\u0004') {
      if (watcher) {
        watcher.close().then(end)
      }
      else end()
    }
  })

  function end () {
    // We may have dangling processes from long-running Lambdae (especially those with inspectors attached)
    // Check for processes the Lambda spawner did not yet terminate before we exit the process
    // Recurse after killing just to make sure none started up while we were killing the others
    function exit () {
      let procs = Object.keys(processes)
      if (procs.length) {
        update.debug.status(`Found the following dangling processes to kill: ${procs}`)
        parallel(procs.map(pid => {
          return callback => {
            kill(pid, 'SIGINT', () => {
              delete processes[`${pid}`]
              update.debug.status(`pid ${pid} successfully terminated`)
              callback()
            })
          }
        }), exit)
      }
      else {
        sandbox.end(function (err) {
          if (err) {
            update.err(err)
            process.exit(1)
          }
          process.exit(0)
        })
      }
    }
    exit()
  }
}
