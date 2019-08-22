let chalk = require('chalk')
let exists = require('fs').existsSync
let glob = require('glob')
let join = require('path').join
let hydrate = require('@architect/hydrate')
let series = require('run-series')
let utils = require('@architect/utils')
let chars = utils.chars

/**
 * Checks for the existence of supported dependency manifests, and auto-hydrates each function's dependencies as necessary
 * Supported manifests:
 * - package.json
 * - requirements.txt
 * - Gemfile
 * - (more to come!)
 */
module.exports = function maybeHydrate (callback) {
  let arc = utils.inventory()
  if (!arc.localPaths.length) {
    callback()
  }
  else {
    let notify = () => console.log(chalk.grey(chars.done, 'Found new functions to hydrate!'))
    let notified = false
    let ops = arc.localPaths.map(path => {
      return function (callback) {
        /**
         * Check each of our supported dependency manifests
         * - Try not to go any deeper into the filesystem than necessary (dep trees can take a long time to walk!)
         * - Assumes Architect deps will have their own deps, helping indicate hydration status
         */
        let fullpath = join(process.cwd(), path)
        series([
          function _packageJson (callback) {
            let packageJson = exists(join(fullpath, 'package.json'))
            if (packageJson) {
              let pattern = join(fullpath, 'node_modules', '*')
              let arcDir = join(fullpath, 'node_modules', '@architect')
              let hydrated = glob.sync(pattern).some(file => !file.includes(arcDir))
              if (!hydrated) {
                if (!notified) notify()
                notified = true
                let basepath = path
                hydrate.install({basepath}, callback)
              }
              else callback()
            }
            else callback()
          },
          function _requirementsTxt (callback) {
            let requirementsTxt = exists(join(fullpath, 'requirements.txt'))
            if (requirementsTxt) {
              let pattern = join(fullpath, 'vendor', '*')
              let arcDir = join(fullpath, 'vendor', 'architect-functions')
              let hydrated = glob.sync(pattern).some(file => !file.includes(arcDir))
              if (!hydrated) {
                if (!notified) notify()
                notified = true
                let basepath = path
                hydrate.install({basepath}, callback)
              }
              else callback()
            }
            else callback()
          },
          function _gemfile (callback) {
            let gemfile = exists(join(fullpath, 'Gemfile'))
            if (gemfile) {
              let pattern = join(fullpath, 'vendor', 'bundle', '*')
              let arcDir = join(fullpath, 'vendor', 'bundle', 'architect-functions')
              let hydrated = glob.sync(pattern).some(file => !file.includes(arcDir))
              if (!hydrated) {
                if (!notified) notify()
                notified = true
                let basepath = path
                hydrate.install({basepath}, callback)
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
