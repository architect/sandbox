let chalk = require('chalk')

/**
 * Print routes as they're being registered
 */
module.exports = function log (params) {
  if (!process.env.ARC_QUIET) {

    let { method, path, src } = params
    let routeMethod = chalk.grey(method.padStart(7))
    let routePath = chalk.cyan(path) + ' '
    let lambdaPath = src.replace(process.cwd(), '').substr(1)
    let lambda = chalk.grey(lambdaPath)
    console.log(chalk.grey(`${routeMethod} ${routePath.padEnd(45, '.')} ${lambda}`))
  }
}
