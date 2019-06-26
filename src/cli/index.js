let chalk = require('chalk')
let hydrate = require('@architect/hydrate')
let path = require('path')
let pkgVer = require('../../package.json').version
let ver = `Sandbox ${pkgVer}`
let watch = require('node-watch')

module.exports = function cli (params={}) {
  // Calling the CLI as a module from a parent package causes a require race, so we have to call them at execution time
  // eslint-disable-next-line
  let http = require('../http')
  // eslint-disable-next-line
  let sandbox = require('../index')

  if (!params.version) params.version = ver
  sandbox.start(params, function watching(err, close) {
    if (err && err.message === 'hydration_error') {
      // Hydration errors already reported, no need to log
      if (close) close()
      process.exit(1)
    }
    if (err) {
      console.log(err)
      if (close) close()
      process.exit(1)
    }
    let watcher = watch(process.cwd(), { recursive: true })
    let arcFile = new RegExp(`${process.cwd()}${path.sep}(\\.arc|app\\.arc|arc\\.yaml|arc\\.json)`)

    watcher.on('change', function(event, name) {
      if (event === 'update' &&
          name.includes(`${process.cwd()}/src/shared`) ||
          name.includes(`${process.cwd()}/src/views`)) {
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
          name.match(arcFile)) {
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
