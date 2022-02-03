let chalk = require('chalk')
let depStatus = require('depstatus')
let { existsSync: exists } = require('fs')
let glob = require('glob')
let { join } = require('path')
let hydrate = require('@architect/hydrate')
let series = require('run-series')
let { chars } = require('@architect/utils')

/**
 * Checks for the existence of supported dependency manifests, and auto-hydrates each function's dependencies as necessary
 *
 * Supported manifests:
 * - package.json
 * - requirements.txt
 * - Gemfile
 * - (more to come!)
 *
 * Not responsible for src/shared + views, handled elsewhere to optimize load time
 */
module.exports = function maybeHydrate ({ cwd, inventory, quiet }, callback) {
  let { inv } = inventory
  if (!inv.lambdaSrcDirs || !inv.lambdaSrcDirs.length) {
    callback()
  }
  else {
    let notify = () => {
      if (!quiet) console.log(chalk.grey(chars.done, 'Found new functions to hydrate!'))
    }
    let notified = false
    // Make a new array, don't inventory
    let lambdaSrcDirs = [ ...inv.lambdaSrcDirs ]

    let shared = inv?.shared?.src || join(cwd, 'src', 'shared')
    let views = inv?.views?.src || join(cwd, 'src', 'views')
    lambdaSrcDirs.push(shared)
    lambdaSrcDirs.push(views)

    let ops = lambdaSrcDirs.map(path => {
      return function (callback) {
        /**
         * Check each of our supported dependency manifests
         * - Try to generally minimize file hits
         * - Try not to go any deeper into the filesystem than necessary (dep trees can take a long time to walk!)
         * - Assumes Architect deps will have their own deps, helping indicate hydration status
         */
        function install (callback) {
          if (!notified) notify()
          notified = true
          // Disable per-function shared file copying; handled project-wide elsewhere
          let copyShared = false
          // Disable sidecar shared/views hydration; handled project-wide elsewhere
          let hydrateShared = path === shared || path === views || false
          hydrate.install({ cwd, inventory, basepath: path, copyShared, hydrateShared, quiet }, callback)
        }
        series([
          function _packageJson (callback) {
            let packageJson = exists(join(path, 'package.json'))
            if (packageJson) {
              let result = depStatus(path)
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
            let requirementsTxt = exists(join(path, 'requirements.txt'))
            if (requirementsTxt) {
              let pattern = join(path, 'vendor', '*')
              let arcDir = join(path, 'vendor', 'architect-functions')
              let hydrated = glob.sync(pattern).some(file => !file.includes(arcDir))
              if (!hydrated) {
                install(callback)
              }
              else callback()
            }
            else callback()
          },
          function _gemfile (callback) {
            let gemfile = exists(join(path, 'Gemfile'))
            if (gemfile) {
              let pattern = join(path, 'vendor', 'bundle', '*')
              let arcDir = join(path, 'vendor', 'bundle', 'architect-functions')
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
