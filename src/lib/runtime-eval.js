/**
 * Provides platform-specific child_process evals for each runtime
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
    return {
      command: isWin ? 'python' : 'python3',
      args: isWin ? [ script ] : [ '-c', script ],
    }
  },
  ruby: function (script) {
    return {
      command: 'ruby',
      args: script,
    }
  }
}
