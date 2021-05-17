let path = require('path')
let spawn = require('./spawn')
let fs = require('fs')

module.exports = function runInNode (options, request, timeout, callback) {

  let denoGlobalConfigPath = path.join(options.cwd, 'vendor', 'views', 'deno.tsconfig.json')
  let denoFunctionConfigPath = path.join(options.cwd, 'deno.tsconfig.json')
  let denoConfig = '';

  if(fs.existsSync(denoGlobalConfigPath)) {
    denoConfig = `--config ${denoGlobalConfigPath}`
  }

  if(fs.existsSync(denoFunctionConfigPath)) {
    denoConfig = `--config ${denoFunctionConfigPath}`
  }

  spawn('deno', [
    'run', '-A', '--unstable',  '--reload', `${denoConfig}`, path.join(__dirname, 'runtimes', 'deno.js')
  ], options, request, timeout, callback)
}
