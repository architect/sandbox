let test = require('tape')
let { join } = require('path')
let cwd = process.cwd()
let sut = join(cwd, 'src', 'http', 'middleware', '_static-path')
let _static = require(sut)

let mock = join(cwd, 'test', 'mock', 'normal')
let staticPath = join(mock, 'public')

test('_static should invoke next() if url does not start with _static', t => {
  t.plan(1)
  _static({ staticPath }, { url: '/api/signup' }, null, () => {
    t.pass('next() invoked')
  })
})
