let fingerprint = require('@architect/utils').fingerprint
let hydrate = require('@architect/hydrate')
let maybeHydrate = require('../http/maybe-hydrate')
let path = require('path')
let pkgVer = require('../../package.json').version
let ver = `Sandbox ${pkgVer}`
let utils = require('@architect/utils')
let watch = require('node-watch')
let updater = utils.updater

// Just use Unix seperators on Windows - path.posix.normalize(process.cwd()) doesn't do what we want
// So we normalise to slash file names (C:/foo/bar) for regex tests, etc.
let pathToUnix = function (string) {
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
    let update = updater('Sandbox')
    let deprecated = process.env.DEPRECATED
    let ts = () => {
      let date = new Date(lastEvent).toLocaleDateString()
      let time = new Date(lastEvent).toLocaleTimeString()
      console.log(`\n[${date}, ${time}]`)
    }

    /**
     * Watch for pertinent filesystem changes
     */
    watcher.on('change', function (event, fileName) {

      // Event criteria
      let fileUpdate = event === 'update'
      let updateOrRemove = event === 'update' || event === 'remove'
      let ready = (Date.now() - lastEvent) >= 500

      fileName = pathToUnix(fileName)

      let rehydrate = ({only, msg}) => {
        let start = Date.now()
        ts()
        update.status(msg)
        hydrate.shared({only}, () => {
          let end = Date.now()
          update.done(`Files rehydrated into functions in ${end - start}ms`)
        })
      }

      /**
       * Reload routes upon changes to Architect project manifest
       */
      if (fileUpdate && fileName.match(arcFile) && ready) {
        // TODO add arc pragma diffing, reload tables, events, etc.
        let {arc} = utils.readArc()

        // Always attempt to close the http server, but only reload if necessary
        http.close()

        // Arc 5 only starts if it's got actual routes to load
        let arc5 = deprecated && arc.http && arc.http.length
        // Arc 6 may start with proxy at root, or empty `@http` pragma
        let arc6 = !deprecated && arc.static || arc.http
        if (arc5 || arc6) {
          let quiet = process.env.QUIET
          process.env.QUIET = true
          let start = Date.now()
          ts()
          update.status('Architect project manifest changed, loading HTTP routes...')
          http.start(function () {
            let end = Date.now()
            process.env.QUIET = quiet
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
                  rehydrate({only, msg})
                }
              }
            })
          })
        }
        else {
          ts()
          update.status('Architect project manifest changed')
        }
      }

      /**
       * Rehydrate functions with shared files upon changes to src/shared
       */
      let isShared = fileName.includes(`${workingDirectory}/src/shared`)
      if (updateOrRemove && ready && isShared) {
        let only = 'shared'
        let msg = 'Shared file changed, rehydrating functions...'
        rehydrate({only, msg})
      }

      /**
       * Rehydrate functions with shared files upon changes to src/views
       */
      let isViews = fileName.includes(`${workingDirectory}/src/views`)
      if (updateOrRemove && ready && isViews) {
        let only = 'views'
        let msg = 'Views file changed, rehydrating views...'
        rehydrate({only, msg})
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
          if (err) update.error(err)
          else {
            if (result) {
              let end = Date.now()
              let only = 'staticJson'
              let msg = `Regenerated public/static.json in ${end - start}ms`
              rehydrate({only, msg})
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
      update.error(`Error:`, err)
    })
  })
}
