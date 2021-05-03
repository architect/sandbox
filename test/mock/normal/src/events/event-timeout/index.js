let fs = require('fs')
let { join } = require('path')

exports.handler = async (event) => {
  event = JSON.parse(event.Records[0].Sns.Message)
  let pathToFile = event.path
  let timeout = 1100 // this event is configured to time out after 1s (see config.arc), so lets set timeout to something slightly higher
  console.log(`will write to ${pathToFile} in ${timeout}ms...`)
  setTimeout(() => {
    // this should never execute as timeout is set to 1 sec in config.arc
    console.log('in timeout, writing to file')
    const writeStream = fs.createWriteStream(pathToFile)
    writeStream.write('hiya')
    writeStream.end()
  }, timeout)
}
