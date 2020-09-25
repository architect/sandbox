let path = require('path')
let invoke = require('../invoke-lambda')

process.on('message', function msg (params) {
  let pathToLambda = path.join(process.cwd(), 'src', 'scheduled', params.name)
  invoke(pathToLambda, cloudwatchEvent(params), function snap (err) {
    let text
    if (err) {
      text = `@${params.name} ${params.rule} failed with ${err.stack}`
    }
    else {
      text = `@${params.name} ${params.rule} complete`
    }
    // send a message to the parent node process
    process.send({ text })
    process.exit()
  })
})

function cloudwatchEvent () {
  return {
    'id': '53dc4d37-cffa-4f76-80c9-8b7d4a4d2eaa',
    'detail-type': 'Scheduled Event',
    'source': 'aws.events',
    'account': '123456789012',
    'time': new Date().getTime(),
    'region': 'us-east-1',
    'resources': [ 'arn:aws:events:us-east-1:123456789012:rule/MyScheduledRule' ],
    'detail': {}
  }
}
