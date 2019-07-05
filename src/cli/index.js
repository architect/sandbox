let chalk = require('chalk')
let hydrate = require('@architect/hydrate')
let path = require('path')
let pkgVer = require('../../package.json').version
let ver = `Sandbox ${pkgVer}`
let watch = require('node-watch')

// Just use Unix seperators on Windows - path.posix.normalize(process.cwd()) doesn't do what we want
// So we normalise to slash file names (C:/foo/bar) for regex tests, etc.
const pathToUnix = function (string) {
  return string.replace(/\\/g, "/");
}

module.exports = function cli(params = {}, callback) {
  // Calling the CLI as a module from a parent package causes some strange require race behavior against relative paths, so we have to call them at execution time
  // eslint-disable-next-line
  let http = require('../http')
  // eslint-disable-next-line
  let sandbox = require('../index')

  if (!params.version) params.version = ver
  sandbox.start(params, function watching(err, close) {
    if (err && err.message === 'hydration_error') {
      // Hydration errors already reported, no need to log
      if (close) close()
      if (callback) callback(err)
      else process.exit(1)
    }
    if (err) {
      console.log(err)
      if (close) close()
      if (callback) callback(err)
      else process.exit(1)
    }
    if (callback) callback(null, close)
    let watcher = watch(process.cwd(), { recursive: true })

    let workingDirectory = pathToUnix(process.cwd())
    let separator = path.posix.sep

    let arcFile = new RegExp(`${workingDirectory}${separator}(\\.arc|app\\.arc|arc\\.yaml|arc\\.json)`)

    watcher.on('change', function (event, fileName) {

      fileName = pathToUnix(fileName)

      if (event === 'update' &&
        fileName.includes(`${workingDirectory}/src/shared`) ||
        fileName.includes(`${workingDirectory}/src/views`)) {
        let indicator = chalk.green.dim('⚬')
        let status = chalk.grey('Shared file changed, rehydrating functions...')
        console.log(`${indicator} ${status}`)

        let start = Date.now()
        hydrate.shared(() => {
          let indicator = chalk.green.dim('✓')
          let end = Date.now()
          let status = chalk.grey(`Project files rehydrated into functions in ${end - start}ms`)
          console.log(`${indicator} ${status}`)
        })
      }
      if (event === 'update' &&
        fileName.match(arcFile)) {
        let indicator = chalk.green.dim('⚬')
        let status = chalk.grey('Architect project manifest changed, reloading HTTP routes...')
        console.log(`${indicator} ${status}`)

        let start = Date.now()
        process.env.QUIET = true
        http.close()
        http.start(function () {
          let indicator = chalk.green.dim('✓')
          let end = Date.now()
          let status = chalk.grey(`HTTP routes reloaded in ${end - start}ms`)
          console.log(`${indicator} ${status}`)
        })
      }
    })

    watcher.on('error', function(err) {
      console.log(`Sandbox error:`, err)
    })
  })
}
