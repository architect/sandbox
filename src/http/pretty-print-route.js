let chalk = require('chalk')

/**
 * print a route as its being registered
 */
module.exports = function log(params) {
  if (!process.env.QUIET) {
    let {verb, route, path} = params
    let httpVerb = chalk.dim(verb.padStart(7)) // 'delete' + 1
    let lambda = chalk.dim(`${verb}${path}`)
    let routePath = chalk.cyan(route) + ' '
    console.log(chalk.grey(`${httpVerb} ${routePath.padEnd(45, '.')} ${lambda}`))
  }
}
