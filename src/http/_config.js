let { join } = require('path')

module.exports = function config ({ apigateway, cwd, inv }) {
  // Handle API type
  let apiType = process.env.ARC_API_TYPE || inv.aws.apigateway || apigateway || 'http'

  // Allow override of 'public' folder
  let staticPath = join(cwd, inv.static.folder)

  return { apiType, staticPath }
}
