let { createWriteStream } = require('fs')
let { join } = require('path')

exports.handler = (event, context, callback) => {
  event = JSON.parse(event.Records[0].Sns.Message)
  let pathToFile = event.path
  let timeout = 1250 // this event is configured to time out after 1s (see config.arc), so let's setTimeout longer
  console.log(`event-timeout-sync will write to ${pathToFile} in ${timeout}ms...`)
  setTimeout(() => {
    // this should never execute as timeout is set to 1 sec in config.arc
    console.log(`event-timeout-sync writing ${pathToFile}`)
    let writeStream = createWriteStream(pathToFile)
    writeStream.write('hiya')
    writeStream.end()
    callback()
  }, timeout)
}
