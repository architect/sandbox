let { createWriteStream } = require('fs')

exports.handler = async (event) => {
  event = JSON.parse(event.Records[0].Sns.Message)
  let pathToFile = event.path
  let timeout = 500
  console.log(`event-no-exit-after-return will write to ${pathToFile} in ${timeout}ms...`)
  setTimeout(() => {
    // this should never execute as sandbox should kill process after return
    console.log(`event-no-exit-after-return ${pathToFile}`)
    let writeStream = createWriteStream(pathToFile)
    writeStream.write('hiya')
    writeStream.end()
    console.log(`event-no-exit-after-return ending now!`)
  }, timeout);

  return { statusCode: 200, body: "some payload" }
}
