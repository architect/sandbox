let { exec } = require('child_process')

// Adapted with gratitude from https://github.com/simoneb/fast-folder-size under the AWISC license
let commands = {
  win32: `du${process.arch === 'x64' ? '64' : ''}.exe -nobanner -accepteula -q -c .`,
  darwin: `du -sk .`,
  linux: `du -sb .`,
}
let processOutput = {
  win32 (stdout) {
    // query stats indexes from the end since path can contain commas as well
    const stats = stdout.split('\n')[1].split(',')
    const bytes = +stats.slice(-2)[0]
    return bytes
  },
  darwin (stdout) {
    const match = /^(\d+)/.exec(stdout)
    const bytes = Number(match[1]) * 1024
    return bytes
  },
  linux (stdout) {
    const match = /^(\d+)/.exec(stdout)
    const bytes = Number(match[1])
    return bytes
  },
}

module.exports = function getFolderSize (cwd, callback) {
  let sys = process.platform
  if (!Object.keys(commands).includes(sys)) {
    return callback(Error('Coldstart testing only supported on Linux, Mac, and Windows'))
  }
  exec(commands[sys], { cwd }, (err, stdout) => {
    if (err) callback(err)
    else callback(null, processOutput[sys](stdout))
  })
}
