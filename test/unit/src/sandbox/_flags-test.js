let { join } = require('path')
let sut = join(process.cwd(), 'src', '_flags')
let flags = require(sut)
let test = require('tape')
let args = process.argv
let cmd = i => {
  process.argv = [ null, null, '/path/to/node', 'some/file' ].concat(i)
  console.log('CLI args set:', process.argv)
}

test('Set up env', t => {
  t.plan(1)
  t.ok(flags, 'Flags module is present')
})

test('Test logLevel flags', t => {
  t.plan(5)
  let f

  cmd([])
  f = flags(false)
  t.equal(f.logLevel, 'normal', `No log flags returned: normal`)

  cmd('-v')
  f = flags(false)
  t.equal(f.logLevel, 'verbose', `-v flag returned: verbose`)

  cmd('--verbose')
  f = flags(false)
  t.equal(f.logLevel, 'verbose', `--verbose flag returned: verbose`)

  cmd('-d')
  f = flags(false)
  t.equal(f.logLevel, 'debug', `-d flag returned: debug`)

  cmd('--debug')
  f = flags(false)
  t.equal(f.logLevel, 'debug', `-debug flag returned: debug`)
})

test('Test port flags', t => {
  t.plan(5)
  let f

  cmd([])
  f = flags(false)
  t.equal(f.port, undefined, `No port flags returned: undefined`)

  process.env.PORT = 1234
  f = flags(false)
  t.equal(f.port, undefined, `PORT env var does not influence flags`)
  delete process.env.PORT

  cmd([ '-p', 'foo' ])
  f = flags(false)
  t.equal(f.port, undefined, `-p without specified port returned: undefined`)

  cmd([ '-p', '33333' ])
  f = flags(false)
  t.equal(f.port, 33333, `-p flag returned: 33333`)

  cmd([ '--port', '33333' ])
  f = flags(false)
  t.equal(f.port, 33333, `--port flag returned: 33333`)
})

test('Test quiet flags', t => {
  t.plan(3)
  let f

  cmd([])
  f = flags(false)
  t.equal(f.quiet, false, `No quiet flags returned: false`)

  cmd([ '-q' ])
  f = flags(false)
  t.equal(f.quiet, true, `-q flag returned: true`)

  cmd([ '--quiet' ])
  f = flags(false)
  t.equal(f.quiet, true, `--quiet flag returned: true`)
})

test('Test hydration symlinking flag', t => {
  t.plan(2)
  let f

  cmd([])
  f = flags(false)
  t.equal(f.symlink, true, `No symlink flags returned: true`)

  cmd([ '--disable-symlinks' ])
  f = flags(false)
  t.equal(f.symlink, false, `--disable-symlinks returned: false`)
})

test('Teardown', t => {
  t.plan(1)
  process.argv = args
  t.pass('Reset process.argv')
})
