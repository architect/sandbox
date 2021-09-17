let { join } = require('path')

module.exports = function config (inv, cwd) {
  // Handle API type
  let apiType = process.env.ARC_API_TYPE || inv.aws.apigateway || 'http'
  delete process.env.ARC_API_TYPE

  // Allow override of 'public' folder
  let staticPath = join(cwd, inv.static.folder)

  return { apiType, staticPath }
}
