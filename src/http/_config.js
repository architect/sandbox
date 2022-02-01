let { join } = require('path')

module.exports = function config ({ apigateway, cwd, inventory }) {
  let { inv } = inventory

  // Handle API type
  let apiType = process.env.ARC_API_TYPE || inv.aws.apigateway || apigateway || 'http'

  // Allow override of 'public' folder; account for @ws only
  let staticPath = inv?.static?.folder ? join(cwd, inv.static.folder) : undefined

  return { apiType, staticPath }
}
