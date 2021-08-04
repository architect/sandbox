let { join } = require('path')

module.exports = function config (arc, cwd) {
  // Handle API type
  let findAPIType = s => s[0] && s[0] === 'apigateway' && s[1]
  let arcAPIType = arc?.aws?.find(findAPIType)?.[1]
  let apiIsValid = arcAPIType && [ 'http', 'httpv1', 'httpv2', 'rest' ].includes(arcAPIType)
  let api = apiIsValid ? arcAPIType : 'http'
  process.env.ARC_API_TYPE = process.env.ARC_API_TYPE || api

  // Allow override of 'public' folder
  let staticFolder = tuple => tuple[0] === 'folder'
  let folder = arc?.static?.find(staticFolder)?.[1] || 'public'
  process.env.ARC_SANDBOX_PATH_TO_STATIC = join(cwd, folder)
}
