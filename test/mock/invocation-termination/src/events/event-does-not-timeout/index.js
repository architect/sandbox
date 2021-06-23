let { join } = require('path')
let { spawnSync } = require('child_process')

exports.handler = async (event) => {
  event = JSON.parse(event.Records[0].Sns.Message)
  let pathToFile = event.path

  let timeout = '.1' // this event is configured to time out after 1s (see config.arc), so we'll sleep not as long
  console.log(`event-does-not-timeout will write to ${pathToFile} in ${timeout}s...`)
  spawnSync('sleep', [ timeout ])

  // this should always execute as timeout is set to 1 sec in config.arc
  console.log(`event-does-not-timeout writing ${pathToFile}`)
  spawnSync('echo', [ 'hiya', '>', pathToFile ], { shell: true })
  console.log(`event-does-not-timeout ending now!`)
  return
}
