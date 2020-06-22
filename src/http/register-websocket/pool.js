let ledger = {}

module.exports = {
  getConnection (connectionId) {
    return ledger[connectionId]
  },
  register (connectionId, ws) {
    ledger[connectionId] = ws
  },
}
