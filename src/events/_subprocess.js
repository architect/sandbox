let invoke = require('../invoke-lambda')

process.on('message', function msg (message) {
  let { lambda } = message
  invoke(lambda, mock(message), function snap (err) {
    let text
    if (err && err.message === 'lambda_not_found') {
      text = `@${message.arcType} ${message.name} missing Lambda handler file\n` +
             `Please create a handler file, or run [npx] arc init, or add 'autocreate true' to your project preferences file's '@create' pragma`
    }
    else if (err) {
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
