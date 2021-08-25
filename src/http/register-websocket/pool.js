let ledger = {}
let times = {}

module.exports = {
  getConnectedAt (connectionId) {
    return times[connectionId]
  },
  getConnection (connectionId) {
    return ledger[connectionId]
  },
  register (connectionId, ws) {
    ledger[connectionId] = ws
    times[connectionId] = Date.now()
  },
  delete (connectionId) {
    delete ledger[connectionId]
    delete times[connectionId]
  },
  reset () {
    ledger = {}
    times = {}
  }
}
