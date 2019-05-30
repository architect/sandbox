let arc = require('@architect/functions')
let data = require('@architect/data')

exports.handler = async function http(req) {
  await data.cats.put({
    catID: new Date(Date.now()).toISOString(),
    msg: 'got pong'
  })
  await arc.queues.publish({name:'pong', payload: {also: true}})
  return {
    statusCode: 302,
    location: '/'
  }
}

