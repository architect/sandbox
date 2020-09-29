let sinon = require('sinon')
let test = require('tape')
let { join } = require('path')
let { scheduled } = require('../../src')
let rateSpy = require('../mock/normal/src/scheduled/rate-scheduled')
let cronSpy = require('../mock/normal/src/scheduled/cron-scheduled')

const timeoutPromise = time => {
  return new Promise(resolve => setTimeout(resolve, time))
}

test('Runs scheduled events from configuration', async t => {
  process.chdir(join(__dirname, '..', 'mock', 'normal'))
  await scheduled.end()

  this.clock = sinon.useFakeTimers()

  t.plan(3)

  await rateSpy.resetHistory()
  await cronSpy.resetHistory()

  await scheduled.start({})

  this.clock.tick(240000)

  this.clock.restore()

  // waiting for the async sub processes to finish
  await timeoutPromise(5000)

  const history = await rateSpy.getCalls()

  t.equals(history.length, 2, 'Scheduled Expression spy was called twice in 4 minutes')

  const call1 = history[0][0]
  const call2 = history[1][0]

  t.notEqual(call1.time, call2.time, 'the different events are given different time')

  const cronHistory = await cronSpy.getCalls()

  t.equals(cronHistory.length, 4, 'Cron-based event were called four times in 4 minutes')

  await scheduled.end()
})
