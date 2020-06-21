let chalk = require('chalk')
let depStatus = require('depstatus')
let exists = require('fs').existsSync
let glob = require('glob')
let join = require('path').join
let hydrate = require('@architect/hydrate')
let series = require('run-series')
let { chars, inventory } = require('@architect/utils')

/**
 * Checks for the existence of supported dependency manifests, and auto-hydrates each function's dependencies as necessary
 * Supported manifests:
 * - package.json
 * - requirements.txt
 * - Gemfile
 * - (more to come!)
 */
module.exports = function maybeHydrate (callback) {
  let arc = inventory()
  let quiet = process.env.ARC_QUIET
  if (!arc.localPaths.length) {
    callback()
  }
  else {
    let notify = () => {
      if (!quiet) console.log(chalk.grey(chars.done, 'Found new functions to hydrate!'))
    }
    let notified = false
    let shared = join('src', 'shared')
    let views = join('src', 'views')
    arc.localPaths.push(shared, views)
    let ops = arc.localPaths.map(path => {
      return function (callback) {
        /**
         * Check each of our supported dependency manifests
         * - Try to generally minimize file hits
         * - Try not to go any deeper into the filesystem than necessary (dep trees can take a long time to walk!)
         * - Assumes Architect deps will have their own deps, helping indicate hydration status
         */
        let basepath = join(process.cwd(), path)
        function install (callback) {
          if (!notified) notify()
          notified = true
          // Disable per-function shared file copying; handled project-wide elsewhere
          let copyShared = false
          // Disable sidecar shared/views hydration; handled project-wide elsewhere
          let hydrateShared = path === shared || path === views || false
          hydrate.install({ basepath, copyShared, hydrateShared }, callback)
        }
        series([
          function _packageJson (callback) {
            let packageJson = exists(join(basepath, 'package.json'))
            if (packageJson) {
              let result = depStatus(basepath)
              let { missing, outdated, warn } = result
              let installDeps = missing.length || outdated.length || warn.length
              if (installDeps) {
                install(callback)
              }
              else callback()
            }
            else callback()
          },
          function _requirementsTxt (callback) {
            let requirementsTxt = exists(join(basepath, 'requirements.txt'))
            if (requirementsTxt) {
              let pattern = join(basepath, 'vendor', '*')
              let arcDir = join(basepath, 'vendor', 'architect-functions')
              let hydrated = glob.sync(pattern).some(file => !file.includes(arcDir))
              if (!hydrated) {
                install(callback)
              }
              else callback()
            }
            else callback()
          },
          function _gemfile (callback) {
            let gemfile = exists(join(basepath, 'Gemfile'))
            if (gemfile) {
              let pattern = join(basepath, 'vendor', 'bundle', '*')
              let arcDir = join(basepath, 'vendor', 'bundle', 'architect-functions')
              let hydrated = glob.sync(pattern).some(file => !file.includes(arcDir))
              if (!hydrated) {
                install(callback)
              }
              else callback()
            }
            else callback()
          },
        ], callback)
      }
    })
    series(ops, callback)
  }
}
