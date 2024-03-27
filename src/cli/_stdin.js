let { emitKeypressEvents } = require('readline')
let sandbox = require('../')

module.exports = function handleStdin (params) {
  let { rehydrate, update, watcher } = params

  let ending = false
  let timeout

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
        force: true,
      })
    }
    if (input === 'S') {
      rehydrate({
        timer: 'rehydrateShared',
        only: 'shared',
        msg: 'Rehydrating src/shared...',
        force: true,
      })
    }
    if (input === 'V') {
      rehydrate({
        timer: 'rehydrateViews',
        only: 'views',
        msg: 'Rehydrating src/views...',
        force: true,
      })
    }
    if (key.sequence === '\u0003' || key.sequence === '\u0004') {
      terminate('ctrl^c')
    }
  })

  process.on('SIGINT', terminate)
  process.on('SIGTERM', terminate)

  function terminate (via) {
    if (ending) return
    else ending = true

    timeout = setTimeout(() => {
      update.err(`Process failed to gracefully exit in 5 seconds via ${via}, forcefully terminated`)
      process.exit(1)
    }, 5000)

    if (watcher) watcher.close().then(end)
    else end()
  }

  function end () {
    sandbox.end(function (err) {
      if (timeout) clearTimeout(timeout)
      if (err) {
        update.err(err)
        process.exit(1)
      }
      process.exit(0)
    })
  }
}
