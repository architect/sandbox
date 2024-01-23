let exitHook = require('exit-hook')
let { emitKeypressEvents } = require('readline')
let sandbox = require('../')

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
      end()
    }
  })

  exitHook(end)

  async function end () {
    try {
      await Promise.all([ watcher?.close(), sandbox.end() ])
    }
    catch (err) {
      update.err(err)
      process.exit(1)
    }
    process.exit(0)
  }
}
