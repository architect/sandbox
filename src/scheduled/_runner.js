let { fork } = require('child_process')
let { join } = require('path')
let chalk = require('chalk')
let awsCronParser = require('aws-cron-parser')

const multipliers = [
  { name: 'minute', multiplier: 1 },
  { name: 'hour', multiplier: 60 },
  { name: 'day', multiplier: 24 * 60 }
]

module.exports = function eventRunner (scheduledEvents) {
  const quiet = process.env.ARC_QUIET
  // All times are counted from here:
  let schedule

  const updateRules = (scheduledEvents) => {
    const starter = new Date()
    schedule = scheduledEvents.map(([ name, ...rule ]) => {
      rule = rule.join(' ')
      let offset
      let nextRun
      let cron

      if (/rate/.test(rule)) { // AWS Schedule Expression
        const value = parseInt(rule.match(/\d+/), 10)
        const multiplier = multipliers.find(m => rule.includes(m.name))
        if (!value || !multiplier) {
          throw new Error(`Incorrect rule ${rule}`)
        }

        offset = multiplier.multiplier * value * 60 * 1000
        nextRun = starter.getTime() + offset
      } else { // AWS Cron expression (6 items)
        const cronString = rule.trim().replace('cron(', '').replace(')', '')
        cron = awsCronParser.parse(cronString)
        nextRun = awsCronParser.next(cron, starter).getTime()
      }

      return {
        offset,
        nextRun,
        cron,
        rule,
        name
      }
    })
  }

  updateRules(scheduledEvents)

  function checkRun () {
    const runTime = new Date().getTime()

    const runners = schedule.filter(item => {
      return runTime >= item.nextRun
    })

    runners.forEach(item => {
      if (item.offset) {
        item.nextRun = runTime + item.offset
      } else {
        const next = awsCronParser.next(item.cron, new Date())
        item.nextRun = next.getTime()
      }
      run(item)
    })
  }

  function run (item) {
    // Spawn a fork of the Node process
    let subprocess = fork(join(__dirname, '_subprocess.js'))
    subprocess.send(item)
    subprocess.on('message', function _message (msg) {
      if (!quiet) {
        console.log(chalk.grey.dim(msg.text))
      }
    })
  }

  const interval = setInterval(checkRun, 1000 * 30)

  return {
    updateRules,
    stop: (cb) => {
      clearInterval(interval)
      cb()
    }
  }
}

