let spawn = require('./spawn')
let { join } = require('path')

module.exports = function runInPhp (params, callback) {
  
  // PHP can't easily be invoked with a string of code like python / ruby
  let runtimePath = join(__dirname, "runtimes", "php.php")
    
  spawn({
    command: 'php',
    args: [ runtimePath],
    ...params,
  }, callback)
}
