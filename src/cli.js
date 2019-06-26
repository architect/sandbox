#!/usr/bin/env node
let chalk = require('chalk')
let hydrate = require('@architect/hydrate')
let http = require('./http')
let path = require('path')
let sandbox = require('./index')
let ver = require('../package.json').version
let version = `Sandbox ${ver}`
let watch = require('node-watch')
let options = process.argv

start()
function start() {
  sandbox.start({version, options}, function watching(err) {
    if (err && err.message === 'hydration_error') {
      // Hydration errors already reported, no need to log
      process.exit(1)
    }
    if (err) {
      console.log(err)
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
