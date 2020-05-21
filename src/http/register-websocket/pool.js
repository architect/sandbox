let connections = []

module.exports = {
  getConnection(connectionId) {
    return connections.find(c=> c.connectionId === connectionId)
  },
  connect(ws, req) {
    console.log('pool.connect', Object.keys(args[1]))
    // figure out how to map the request to the socket connection here
  },
  add(v) {
    connections.push(v)
  }
}
