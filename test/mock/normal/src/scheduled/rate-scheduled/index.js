const path = require('path')
const { writeFile, unlink, readFile } = require('fs').promises
const EOL = require('os')

/*
 * This test spy is a bit funny.
 * Because scheduled events are ran in child processes,
 * i decided to try writing the arguments to file,
 * and then read them back in in the integration test
 * to be able to make assertions about the calls
 */
const WRITE_FILENAME = path.join(__dirname, 'TEST_ARGUMENTS')

module.exports.handler = async function () {
  return writeFile(WRITE_FILENAME, EOL + JSON.stringify(arguments), { flag: 'a' })
}

module.exports.resetHistory = async () => {
  try {
    return await unlink(WRITE_FILENAME)
  } catch (e) {
    if (e.code === 'ENOENT') {
      // ignore 'file not found, means the test just is not ran yet'
      return
    }

    throw e
  }
}


module.exports.getCalls = async () => {
  try {
    const log = await readFile(WRITE_FILENAME, 'utf8')
    return log.split(EOL).filter(str => str).map(line => JSON.parse(line))
  } catch (e) {
    if (e.code === 'ENOENT') {
      // to get better test signal, return 'no calls'
      return []
    }

    throw e
  }
}
