let _ws = require('ws')

module.exports = function livereload (_arcServices, params) {
  let { inventory, restart, update } = params
  let enabled = inventory.inv._project.preferences?.sandbox?.livereload
  if (!enabled) return

  let ws = new _ws.WebSocketServer({ server: _arcServices })
  if (!restart) update.done('Live reload started')

  return ws
}
