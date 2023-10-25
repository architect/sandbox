let chalk = require('chalk')
let depStatus = require('depstatus')
let { existsSync: exists, readFileSync, rmSync } = require('fs')
let { join } = require('path')
let hydrate = require('@architect/hydrate')
let series = require('run-series')
let { chars } = require('@architect/utils')

/**
 * Checks for the existence of supported dependency manifests, and auto-hydrates dependencies as necessary
 * Supported manifests: `package.json`, `requirements.txt`, `Gemfile`
 */
module.exports = function maybeHydrate ({ cwd, inventory, quiet, deleteVendor, update }, callback) {
  let { inv } = inventory
  if (!inv.lambdaSrcDirs || !inv.lambdaSrcDirs.length) {
    callback()
  }
  else {
    /**
     * Coldstart simulator status
     */
    let coldstart = inv._project?.preferences?.sandbox?.coldstart || false
    if (coldstart) {
      update.done('Started with Lambda coldstart simulator')
    }

    // Enable vendor dir deletion by default
    let del = deleteVendor === undefined ? true : deleteVendor
    if (inv._project.preferences?.sandbox?.['delete-vendor'] !== undefined) {
      del = inv._project.preferences.sandbox['delete-vendor']
    }

    let notify = () => {
      if (!quiet) console.log(chalk.grey(chars.done, 'Found new functions to hydrate!'))
    }
    let destroy = filepath => del && rmSync(filepath, { recursive: true, force: true })
    let notified = false
    // Make a new array, don't inventory
    let srcDirs = [ ...inv.lambdaSrcDirs ]

    let shared = inv?.shared?.src || join(cwd, 'src', 'shared')
    let views = inv?.views?.src || join(cwd, 'src', 'views')
    srcDirs.push(shared)
    srcDirs.push(views)

    let ops = srcDirs.map(path => {
      return function (callback) {
        let isNode, isPython, isRuby
        let lambda = inv.lambdasBySrcDir[path]
        if (lambda) {
          if (Array.isArray(lambda)) lambda = lambda[0] // Normalize possible multi-tenant Lambdas
          let { config } = lambda
          let { runtime, runtimeConfig } = config
          isNode = runtime.startsWith('nodejs') || runtimeConfig?.baseruntime?.startsWith('nodejs')
          isPython = runtime.startsWith('python')
          isRuby = runtime.startsWith('ruby')
        }

        // Possible manifests
        let packageJson = join(path, 'package.json')
        let requirementsTxt = join(path, 'requirements.txt')
        let gemfile = join(path, 'Gemfile')

        /**
         * Check each of our supported dependency manifests
         * - Try to generally minimize file hits
         * - Try not to go any deeper into the filesystem than necessary (dep trees can take a long time to walk!)
         * - Generally be aggressive with destroying vendor dirs
         */
        function install (callback) {
          if (!notified) notify()
          notified = true
          // Disable per-function shared file copying; handled project-wide elsewhere
          let copyShared = false
          // Disable sidecar shared/views hydration; handled project-wide elsewhere
          let hydrateShared = path === shared || path === views || false
          hydrate.install({ cwd, inventory, basepath: path, copyShared, hydrateShared, local: true, quiet }, callback)
        }

        if (isNode || (!lambda && exists(packageJson))) {
          let nodeModules = join(path, 'node_modules')

          // Don't start by destroying `node_modules`, as `depStatus` may help us hydrate whatever is missing
          if (exists(packageJson)) {
            // Check to see if there was a failed or aborted deploy
            let pkg = JSON.parse(readFileSync(packageJson))
            if (pkg?._arc === 'autoinstall') {
              destroy(packageJson)
              destroy(nodeModules)
              return callback()
            }

            let result = depStatus(path)
            let { missing, outdated, warn } = result
            let installDeps = missing.length || outdated.length || warn.length

            if (installDeps) install(callback)
            // Looks like deps are all good here, no need to destroy `node_modules`
            else callback()
          }
          else if (coldstart) {
            destroy(nodeModules)
            install(callback)
          }
          else {
            callback()
          }
        }

        else if (isPython || (!lambda && exists(requirementsTxt))) {
          let vendor = join(path, 'vendor')
          // Always start fresh
          destroy(vendor)

          if (exists(requirementsTxt)) {
            // Check to see if there was a failed or aborted deploy
            let reqs = readFileSync(requirementsTxt).toString()
            if (reqs.includes('# _arc: autoinstall')) {
              destroy(requirementsTxt)
              return callback()
            }
            install(callback)
          }
          else if (coldstart) {
            install(callback)
          }
          else callback()
        }

        else if (isRuby || (!lambda && exists(gemfile))) {
          let vendor = join(path, 'vendor')
          // Always start fresh
          destroy(vendor)

          if (exists(gemfile)) {
            install(callback)
          }
          else if (coldstart) {
            install(callback)
          }
          else callback()
        }

        // All other runtimes, shared + views
        else callback()
      }
    })
    series(ops, callback)
  }
}
