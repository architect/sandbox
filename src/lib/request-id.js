const Hashid = require('@begin/hashid')

const hash = new Hashid('requestId')

let counter = Date.now()
module.exports = function makeRequestId () {
  return hash.encode(counter++)
}
