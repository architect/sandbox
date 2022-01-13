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
    // Windows `python -c` doesn't like multi-liners, so serialize script
    let command = process.platform === 'win32' ? 'python' : 'python3'
    return {
      command,
      args: [ '-c', script ],
    }
  },
  ruby: function (script) {
    return {
      command: 'ruby',
      args: script,
    }
  }
}
