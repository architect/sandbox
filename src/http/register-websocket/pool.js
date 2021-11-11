let pool = {
  connections: {},
  getConnectedAt (connectionId) {
    return pool.connections[connectionId]?.connectedAt
  },
  getConnection (connectionId) {
    return pool.connections[connectionId]?.ws
  },
  register (connectionId, ws) {
    pool.connections[connectionId] = {
      ws,
      connectedAt: Date.now()
    }
  },
  delete (connectionId) {
    delete pool.connections[connectionId]
  },
  reset () {
    pool.connections = {}
  }
}

module.exports = pool
