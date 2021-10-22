let { join } = require('path')
let src = join(__dirname, 'src' )

module.exports = {
  sandbox: {
    http: function ({ arc, cloudformation, inventory }) {
      console.log('adding get /test route')
      return [ { 
        name: 'get /test',
        config: {
          ...inventory.inv._project.defaultFunctionConfig,
          timeout: 30,
          memory: 1152,
          runtime: 'nodejs14.x',
          handler: 'index.handler',
          concurrency: 'unthrottled',
          shared: true,
          env: true,
          views: true
        },
        src: src,
        handlerFile: join(src, 'index.js'),
        handlerFunction: 'handler',
        configFile: join(src, 'config.arc'),
        method: 'get',
        path: '/test'
        } ]
    }
  }
}
