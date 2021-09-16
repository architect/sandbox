let { sep } = require('path')
let chalk = require('chalk')
let { getPorts } = require('../lib')

/**
 * Pretty print @http + @ws routes
 */
module.exports = function prettyPrint ({ apiType, cwd, inventory, port, update }) {
  let { http, ws } = inventory.inv

  let padL = str => str.padStart(7)
  let padR = str => str.padEnd(45, '.')
  let strip = str => str.replace(cwd, '').substr(1)

  if (http) {
    let folder = `${inventory.inv.static.folder}${sep}`
    let msgs = {
      rest: 'REST API mode / Lambda proxy',
      http: 'HTTP API mode / Lambda proxy v2.0 format',
      httpv2: 'HTTP API mode / Lambda proxy v2.0 format',
      httpv1: 'HTTP API mode / Lambda proxy v1.0 format',
    }
    let andWs = ws ? '& @ws ' : ''
    update.done(`Available @http (${msgs[apiType]}) ${andWs}routes`)
    http.forEach(({ method, path, src, arcStaticAssetProxy }) => {
      let routeMethod = chalk.grey(padL(method))
      let routePath = chalk.cyan(path) + ' '
      let lambdaPath = strip(src)
      let lambda = chalk.grey(arcStaticAssetProxy ? folder : lambdaPath)
      update.raw(chalk.grey(`${routeMethod} ${padR(routePath)} ${lambda}`))
    })
  }

  if (ws) {
    ws.forEach(({ name, src }) => {
      let type = chalk.grey(padL('ws'))
      let routeName = chalk.cyan(name) + ' '
      let lambdaPath = strip(src)
      let lambda = chalk.grey(lambdaPath)
      update.raw(chalk.grey(`${type} ${padR(routeName)} ${lambda}`))
    })
  }

  if (http || ws) {
    let { httpPort } = getPorts(port)
    let link = chalk.green.bold.underline(`http://localhost:${httpPort}\n`)
    update.raw(`\n    ${link}`)
  }
}
