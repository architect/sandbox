let hydrate = require('@architect/hydrate')

// Rehydrator timers
let timers = {
  rehydrateAll: null,
  rehydrateShared: null,
  rehydrateViews: null,
  rehydrateStatic: null,
}

/**
 * Rehydrate! Rehydrate! Rehydrate!
 * - Generally we rely on symlinking, which is super fast
 * - But if things get weird or need restoring, out comes the rehydrator
 */
module.exports = function rehydrator (params) {
  let { debounce, quiet, symlink, ts, update } = params

  return function rehydrate ({ timer, only, msg, force }, callback) {
    let now = Date.now()
    clearTimeout(timers[timer])
    // Forcing enables restoration of symlinks after a deploy
    if (force || !symlink) {
      timers[timer] = setTimeout(() => {
        ts(now)
        let start = Date.now()
        if (msg) update.status(msg)
        hydrate.shared({ only, quiet, symlink }, () => {
          let end = Date.now()
          update.done(`${symlink ? 'Symlinks' : 'Files'} rehydrated into functions in ${end - start}ms`)
          if (callback) callback()
        })
      }, debounce)
    }
    else if (callback) callback()
  }
}
