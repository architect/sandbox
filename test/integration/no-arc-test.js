let { join } = require('path')
let tiny = require('tiny-json-http')
let test = require('tape')
let sut = join(process.cwd(), 'src')
let sandbox = require(sut)
let { run, startup, shutdown, url } = require('../utils')

test('Set up env', t => {
  t.plan(1)
  t.ok(sandbox, 'Sandbox is present')
})

test('Run Arc project manifest tests', t => {
  run(runTests, t)
  t.end()
})

function runTests (runType, t) {
  let mode = `[No manifest present / ${runType}]`

  t.test(`${mode} Start Sandbox without an Architect project manifest`, t => {
    startup[runType](t, 'no-arc')
  })

  t.test('get /', t => {
    t.plan(2)
    tiny.get({ url }, function _got (err, data) {
      if (err) t.end(err)
      else {
        t.ok(data, 'got /')
        t.ok(data.body.startsWith('Hello from Architect Sandbox running without an Architect file!'), 'is hello world')
      }
    })
  })

  t.test(`${mode} Shut down Sandbox`, t => {
    shutdown[runType](t)
  })
}
