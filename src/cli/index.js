let hydrate = require('@architect/hydrate')
let maybeHydrate = require('../http/maybe-hydrate')
let path = require('path')
let fs = require('fs')
let pkgVer = require('../../package.json').version
let ver = `Sandbox ${pkgVer}`
let watch = require('node-watch')
let { fingerprint, pathToUnix, updater } = require('@architect/utils')
let readArc = require('../sandbox/read-arc')
let osPath = require('ospath')

module.exports = function cli (params = {}, callback) {
  // Calling the CLI as a module from a parent package causes some strange require race behavior against relative paths, so we have to call them at execution time
  // eslint-disable-next-line
  let http = require('../http')
  // eslint-disable-next-line
  let sandbox = require('../index')

  if (!params.version) params.version = ver
  sandbox.start(params, function watching (err, close) {
    if (err) {
      // Hydration errors already reported, no need to log
      if (err.message !== 'hydration_error') console.log(err)
      if (close) close()
      if (callback) callback(err)
      else process.exit(1)
    }
    else if (callback) callback(null, close)

    // Setup
    let update = updater('Sandbox')
    let deprecated = process.env.DEPRECATED
    let watcher = watch(process.cwd(), { recursive: true })
    let workingDirectory = pathToUnix(process.cwd())
    let separator = path.posix.sep

    // Arc stuff
    let { arc } = readArc()
    let arcFile = new RegExp(`${workingDirectory}${separator}(\\.arc|app\\.arc|arc\\.yaml|arc\\.json)`)
    let folderSetting = tuple => tuple[0] === 'folder'
    let staticFolder = arc.static && arc.static.some(folderSetting) ? arc.static.find(folderSetting)[1] : 'public'

    // Timers
    let lastEvent
    let arcEventTimer
    let rehydrateSharedTimer
    let rehydrateViewsTimer
    let fingerprintTimer
    let ts = () => {
      if (!process.env.ARC_QUIET) {
        let date = new Date(lastEvent).toLocaleDateString()
        let time = new Date(lastEvent).toLocaleTimeString()
        console.log(`\n[${date}, ${time}]`)
      }
    }

    // Cleanup after any past runs
    let pauseFile = path.join(osPath.tmp(), '_pause-architect-sandbox-watcher')
    if (fs.existsSync(pauseFile)) {
      fs.unlinkSync(pauseFile)
    }
    let paused = false

    /**
     * Watch for pertinent filesystem changes
     */
    watcher.on('change', function (event, fileName) {

      if (!paused && fs.existsSync(pauseFile)) {
        paused = true
        update.status('Watcher temporarily paused')
      }
      if (paused && !fs.existsSync(pauseFile)) {
        update.status('Watcher no longer paused')
        paused = false
      }

      // Event criteria
      let fileUpdate = event === 'update'
      let updateOrRemove = event === 'update' || event === 'remove'
      fileName = pathToUnix(fileName)

      let rehydrate = ({ only, msg }) => {
        let start = Date.now()
        update.status(msg)
        hydrate.shared({ only }, () => {
          let end = Date.now()
          update.done(`Files rehydrated into functions in ${end - start}ms`)
        })
      }

      /**
       * Reload routes upon changes to Architect project manifest
       */
      if (fileUpdate && fileName.match(arcFile) && !paused) {
        clearTimeout(arcEventTimer)
        arcEventTimer = setTimeout(() => {
          // TODO add arc pragma diffing, reload tables, events, etc.
          let { arc } = readArc()

          // Always attempt to close the http server, but only reload if necessary
          http.close()

          // Arc 5 only starts if it's got actual routes to load
          let arc5 = deprecated && arc.http && arc.http.length
          // Arc 6 may start with proxy at root, or empty `@http` pragma
          let arc6 = !deprecated && arc.static || arc.http
          if (arc5 || arc6) {
            ts()
            let quiet = process.env.ARC_QUIET
            process.env.ARC_QUIET = true
            let start = Date.now()
            update.status('Architect project manifest changed, loading HTTP routes...')
            http.start(function () {
              let end = Date.now()
              if (!quiet) delete process.env.ARC_QUIET
              update.done(`HTTP routes reloaded in ${end - start}ms`)
              maybeHydrate(function (err) {
                if (err) {
                  update.error(`Error hydrating new functions:`, err)
                }
                else {
                  update.done(`Functions are ready to go!`)
                  if (deprecated) {
                    let only = 'arcFile'
                    let msg = 'Rehydrating functions with new project manifest'
                    rehydrate({ only, msg })
                  }
                }
              })
            })
          }
          else {
            ts()
            update.status('Architect project manifest changed')
          }
        }, 50)
      }

      /**
       * Rehydrate functions with shared files upon changes to src/shared
       */
      let isShared = fileName.includes(`${workingDirectory}/src/shared`)
      if (updateOrRemove && isShared && !paused) {
        clearTimeout(rehydrateSharedTimer)
        rehydrateSharedTimer = setTimeout(() => {
          ts()
          let only = 'shared'
          let msg = 'Shared file changed, rehydrating functions...'
          rehydrate({ only, msg })
        }, 50)
      }

      /**
       * Rehydrate functions with shared files upon changes to src/views
       */
      let isViews = fileName.includes(`${workingDirectory}/src/views`)
      if (updateOrRemove && isViews && !paused) {
        clearTimeout(rehydrateViewsTimer)
        rehydrateViewsTimer = setTimeout(() => {
          ts()
          let only = 'views'
          let msg = 'Views file changed, rehydrating views...'
          rehydrate({ only, msg })
        }, 50)
      }

      /**
       * Regenerate public/static.json upon changes to public/
       */
      if (updateOrRemove && arc.static && !paused &&
          fileName.includes(`${workingDirectory}/${staticFolder}`) &&
          !fileName.includes(`${workingDirectory}/${staticFolder}/static.json`)) {
        clearTimeout(fingerprintTimer)
        fingerprintTimer = setTimeout(() => {
          ts()
          let start = Date.now()
          fingerprint({}, function next (err, result) {
            if (err) update.error(err)
            else {
              if (result) {
                let end = Date.now()
                let only = 'staticJson'
                let msg = `Regenerated public/static.json in ${end - start}ms`
                rehydrate({ only, msg })
              }
            }
          })
        }, 50)
      }

      lastEvent = Date.now()
    })

    /**
     * Watch for sandbox errors
     */
    watcher.on('error', function (err) {
      update.error(`Error:`, err)
    })
  })
}
