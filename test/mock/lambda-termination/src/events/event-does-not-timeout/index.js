let { createWriteStream } = require('fs')
let { join } = require('path')

exports.handler = (event, context, callback) => {
  event = JSON.parse(event.Records[0].Sns.Message)
  let pathToFile = event.path

  let timeout = 100 // this event is configured to time out after 1s (see config.arc), so we'll sleep not as long
  console.log(`event-does-not-timeout will write to ${pathToFile} in ${timeout}ms...`)
  setTimeout(() => {
    // this should always execute as timeout is set to 1 sec in config.arc
    console.log(`event-does-not-timeout writing ${pathToFile}`)
    let writeStream = createWriteStream(pathToFile)
    writeStream.write('hiya')
    writeStream.end()
    callback()
  }, timeout)
}
