let { createWriteStream } = require('fs')
let { join } = require('path')

exports.handler = async (event) => {
  event = JSON.parse(event.Records[0].Sns.Message)
  let pathToFile = event.path
  let timeout = 1250 // this event is configured to time out after 1s (see config.arc), so we'll setTimeout longer
  console.log(`event-timeout-async will write to ${pathToFile} in ${timeout}ms...`)
  await new Promise(resolve => setTimeout(resolve, timeout))

  // this should never execute as timeout is set to 1 sec in config.arc
  console.log(`event-timeout-async writing ${pathToFile}`)
  let writeStream = createWriteStream(pathToFile)
  writeStream.write('hiya')
  writeStream.end()
  console.log(`event-timeout-async ending now!`)
  return
}
