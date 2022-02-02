let Hashid = require('@begin/hashid')
let hash = new Hashid('requestId')
let counter = Date.now()

module.exports = function makeRequestId () {
  return hash.encode(counter++)
}
