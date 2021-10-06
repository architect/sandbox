let http = require('http')

let activeSideChannel
let makeSideChannel = async (port = 3433) => {
  if (activeSideChannel) {
    throw new Error('A test side-channel is already active, only one can be active at a time')
  }
  let events = []
  console.log('Starting test side-channel')
  activeSideChannel = http.createServer((req, res) => {
    let inputData = []
    req.on('data', data => {
      inputData.push(data)
    })
    req.on('end', () => {
      res.writeHead(200)
      res.end(() => {
        let postData = Buffer.concat(inputData).toString()
        events.push(postData)
      })
    })
  })

  await new Promise((resolve, reject) => activeSideChannel.listen(port, err => err ? reject(err) : resolve()))
  console.log('Started test side-channel')

  return {
    async nextRequest () {
      if (!activeSideChannel) {
        throw new Error('Test side-channel has been shut down')
      }
      if (events.length === 0) {
        console.log('Waiting for events in test side-channel')
        await new Promise(resolve => activeSideChannel.once('request', (req, res) => res.once('finish', resolve)))
      }
      // parsing here makes the errors show a decent stacktrace
      return JSON.parse(events.shift())
    },
    async shutdown () {
      await new Promise((resolve, reject) => activeSideChannel.close(err => err ? reject(err) : resolve()))
      activeSideChannel = undefined
    },
    reset () {
      events = []
    }
  }
}

module.exports = { makeSideChannel }
