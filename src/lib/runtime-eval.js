let { execSync } = require('child_process')
let pyCommandCache

/**
 * Provides platform-specific runtime-specific commands for child_process spawns
 */
module.exports = {
  deno: function (script) {
    return {
      command: 'deno',
      args: [ 'eval', script ],
    }
  },
  node: function (script) {
    // process.pkg = binary dist mode, leading space works around pkg#897
    return {
      command: process.pkg ? ' ' : 'node',
      args: process.pkg ? [ 'node', '-e', script ] : [ '-e', script ],
    }
  },
  'node-esm': function (script) {
    // process.pkg = binary dist mode, leading space works around pkg#897
    return {
      command: process.pkg ? ' ' : 'node',
      args: process.pkg
        ? [ 'node', '--input-type=module', '-e', script ]
        : [ '--input-type=module', '-e', script ],
    }
  },
  python: function (script) {
    // Windows can't feed `python -c` multi-liners, and indents (`try/except`) = no bueno
    // Here comes the hacks!
    let isWin = process.platform.startsWith('win')
    let command = 'python3'
    // Oh, also, depending on how you installed Python in Windows, you may or may not need to use `py.exe` instead of `python.exe` (or `python3.exe`) lolwtf so let's figure that out as well
    if (isWin && !pyCommandCache) {
      try {
        // `py` is conveniently installed as a symlink from the official installer, and should be available in PS + cmd; prefer `py` since it has preferred version selection logic
        execSync('where py')
        command = 'py'
      }
      // `python` should(?) be installed by Windows Store Python installations
      catch { command = 'python' }
      pyCommandCache = command
    }
    return {
      command: pyCommandCache || command,
      args: isWin ? [ script ] : [ '-c', script ],
    }
  },
  ruby: function (script) {
    return {
      command: 'ruby',
      args: script,
    }
  },
}
