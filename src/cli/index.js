let chalk = require('chalk')
let fingerprint = require('@architect/utils').fingerprint
let hydrate = require('@architect/hydrate')
let maybeHydrate = require('../http/maybe-hydrate')
let path = require('path')
let pkgVer = require('../../package.json').version
let ver = `Sandbox ${pkgVer}`
let utils = require('@architect/utils')
let watch = require('node-watch')
let chars = utils.chars

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

    let {arc} = utils.readArc()
    let arcFile = new RegExp(`${workingDirectory}${separator}(\\.arc|app\\.arc|arc\\.yaml|arc\\.json)`)
    let lastEvent = Date.now()

    /**
     * Watch for pertinent filesystem changes
     */
    watcher.on('change', function (event, fileName) {

      // Event criteria
      let update = event === 'update'
      let updateOrRemove = event === 'update' || event === 'remove'
      let ready = (Date.now() - lastEvent) >= 500

      fileName = pathToUnix(fileName)

      let rehydrate = () => {
        let start = Date.now()
        let status = chalk.grey('Shared file changed, rehydrating functions...')
        console.log(`${chars.start} ${status}`)
        hydrate.shared({}, () => {
          let end = Date.now()
          let status = chalk.grey(`Project files rehydrated into functions in ${end - start}ms`)
          console.log(`${chars.done} ${status}`)
        })
      }

      /**
       * Reload routes upon changes to Architect project manifest
       */
      if (update && fileName.match(arcFile) && ready) {
        let status = chalk.grey('Architect project manifest changed, reloading HTTP routes...')
        console.log(`${chars.start} ${status}`)

        let start = Date.now()
        process.env.QUIET = true
        http.close()
        http.start(function () {
          let end = Date.now()
          let status = chalk.grey(`HTTP routes reloaded in ${end - start}ms`)
          console.log(`${chars.done} ${status}`)
        })
        maybeHydrate(function (err) {
          if (err) {
            let status = chalk.grey(`Error hydrating new functions:`, err)
            console.log(status)
          }
          else {
            let status = chalk.grey(`Functions are ready to go!`)
            console.log(`${chars.done} ${status}`)
          }
        })
      }

      /**
       * Rehydrate functions with shared files upon changes to src/shared and src/views
       */
      let isShared = (fileName.includes(`${workingDirectory}/src/shared`) || fileName.includes(`${workingDirectory}/src/views`))
      if (updateOrRemove && ready && isShared) {
        let status = chalk.grey('Shared file changed, rehydrating functions...')
        console.log(`${chars.start} ${status}`)
        rehydrate()
      }

      /**
       * Regenerate public/static.json upon changes to public/
       */
      let folderSetting = tuple => tuple[0] === 'folder'
      let staticFolder = arc.static && arc.static.some(folderSetting) ? arc.static.find(folderSetting)[1] : 'public'
      if (updateOrRemove && arc.static && ready &&
          fileName.includes(`${workingDirectory}/${staticFolder}`) &&
          !fileName.includes(`${workingDirectory}/${staticFolder}/static.json`)) {
        let start = Date.now()
        fingerprint({}, function next(err, result) {
          if (err) console.log(err)
          else {
            if (result) {
              let end = Date.now()
              console.log(chars.done, chalk.grey(`Regenerated public/static.json in ${end - start}ms`))
              rehydrate()
            }
          }
        })
      }
      lastEvent = Date.now()

    })

    /**
     * Watch for sandbox errors
     */
    watcher.on('error', function(err) {
      console.log(`Sandbox error:`, err)
    })
  })
}
