let _ws = require('ws')

module.exports = function livereload (_arcServices, params) {
  let { inventory, restart, update } = params

  let livereloadSetting = inventory.inv._project.preferences?.sandbox?.livereload
  let enabled = typeof livereloadSetting === 'undefined' ? true : livereloadSetting
  if (!enabled) return

  let ws = new _ws.WebSocketServer({ server: _arcServices })
  if (!restart) update.verbose.done('Live reload started')

  return ws
}
