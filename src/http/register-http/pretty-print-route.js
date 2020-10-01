let chalk = require('chalk')

/**
 * Print routes as they're being registered
 */
module.exports = function log (params) {
  if (!process.env.ARC_QUIET) {
    let { method, route, path } = params
    let httpMethod = chalk.grey(method.padStart(7))
    let routePath = chalk.cyan(route) + ' '
    let lambda = chalk.grey(`${method}${path}`)
    console.log(chalk.grey(`${httpMethod} ${routePath.padEnd(45, '.')} ${lambda}`))
  }
}
