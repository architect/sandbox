let { basename, join } = require('path')
let { existsSync, mkdirSync, rmSync } = require('fs')
let { copySync } = require('fs-extra')
let { NOISY_TESTS, CI } = process.env

let b64dec = i => Buffer.from(i, 'base64').toString()

let copy = thing => JSON.parse(JSON.stringify(thing))

// Dummy AWS creds
let credentials = {
  accessKeyId: 'arcDummyAccessKey',
  secretAccessKey: 'arcDummySecretKey',
}

let data = { hi: 'there' }

let timedOut = /Lambda timed out/g
function isWindowsPythonStalling (err, t) {
  if (!err || !CI) return
  if (err?.raw?.statusCode === 500 && err?.body?.match(timedOut)) {
    t.plan(1)
    t.pass(
      `Windows GitHub Actions sometimes fails to execute our Python script in a reasonable amount of ` +
      `time, failing to get past the import statements of builtins in multiple seconds. After dozens ` +
      `of attempts to pin down why, we are adding this highly specific and extremely disconcerting ` +
      `workaround. Help wanted!`,
    )
    return true
  }
}

let port = 6666

// Enable NOISY_TESTS for local debugging
let quiet = NOISY_TESTS === 'true' ? false : true
if (NOISY_TESTS && CI) {
  throw Error('Noisy tests cannot be enabled in CI!')
}

let url = `http://localhost:${port}`
let wsUrl = `ws://localhost:${port}`

function prepTmpDir (t, copying, tmp) {
  try {
    rmSync(tmp, { recursive: true, force: true, maxRetries: 10 })
    if (existsSync(tmp)) {
      t.fail(`${tmp} should not exist`)
      process.exit(1)
    }
    if (copying) {
      let dest = join(tmp, basename(copying))
      mkdirSync(dest, { recursive: true })
      copySync(copying, dest)
    }
  }
  catch (err) {
    t.fail('Prep failed')
    console.log(err)
    process.exit(1)
  }
}

function rmPublic (t) {
  try {
    let publicFolder = join(process.cwd(), 'public')
    rmSync(publicFolder, { recursive: true, force: true, maxRetries: 10 })
    t.notOk(existsSync(publicFolder), 'Destroyed auto-generated ./public folder')
  }
  catch (err) {
    t.fail(err)
  }
}

// Integration test runner
let bin = join(process.cwd(), 'bin', `sandbox-binary${process.platform.startsWith('win') ? '.exe' : ''}`)
let run = (runTests, t) => {
  if (!process.env.BINARY_ONLY) {
    runTests('module', t)
  }
  if (!process.env.MODULE_ONLY && existsSync(bin)) {
    runTests('binary', t)
  }
}

module.exports = {
  b64dec,
  copy,
  credentials,
  data,
  isWindowsPythonStalling,
  port,
  quiet,
  prepTmpDir,
  rmPublic,
  run,
  url,
  wsUrl,
}
