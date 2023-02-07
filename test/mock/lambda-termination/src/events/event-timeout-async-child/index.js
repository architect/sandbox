let { join } = require('path')
let { spawnSync } = require('child_process')

exports.handler = async (event) => {
  event = JSON.parse(event.Records[0].Sns.Message)
  let pathToFile = event.path
  let timeout = '1.25' // this event is configured to time out after 1s (see config.arc), so we'll sleep longer
  console.log(`event-timeout-async-child will write to ${pathToFile} in ${timeout}s...`)
  // this should sleep but be terminated before getting to echo as timeout is set to 1 sec in config.arc
  spawnSync('sleep', [ timeout, '&&', 'echo', 'hiya', '>', pathToFile ], { shell: true })

  // Extra super prove the parent process was terminated
  console.log(`event-timeout-async-child writing ${pathToFile} (again)`)
  spawnSync('echo', [ 'hiya', '>', pathToFile ], { shell: true })
  console.log(`event-timeout-async-child ending now!`)
  return
}
