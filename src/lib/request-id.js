let Hashid = require('@architect/utils/hashid')
let hash = new Hashid('requestId')
let counter = Date.now()

module.exports = function makeRequestId () {
  return hash.encode(counter++)
}
