let path = require('path')
let invoke = require('../invoke-lambda')

process.on('message', function msg (message) {
  let pathToLambda = path.join(process.cwd(), 'src', message.arcType + 's', message.name)
  invoke(pathToLambda, mock(message), function snap (err) {
    let text
    if (err) {
      text = `@${message.arcType} ${message.name} failed with ${err.stack}`
    }
    else {
      text = `@${message.arcType} ${message.name} complete`
    }
    // send a message to the parent node process
    process.send({ text })
    process.exit()
  })
})

function mock (message) {
  switch (message.arcType) {
  case 'event':
    return { Records: [ { Sns: { Message: JSON.stringify(message.payload) } } ] } // this is fine
  case 'queue':
    return { Records: [ { body: JSON.stringify(message.payload) } ] } // also fine
  default:
    throw new Error('Unrecognized event type ' + message.arcType)
  }
}
