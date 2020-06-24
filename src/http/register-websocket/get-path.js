let join = require('path').join

module.exports = function getPath (name) {
  let wsName = name => process.env.DEPRECATED ? `ws-${name}` : name
  let cwd = name => join(process.cwd(), 'src', 'ws', wsName(name))
  return cwd(name)
}
