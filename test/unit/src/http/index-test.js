let { join } = require('path')
let proxyquire = require('proxyquire')
let sinon = require('sinon')
let test = require('tape')
let _inventory = require('@architect/inventory')
let mock = join(process.cwd(), 'test', 'mock')

// let spy = sinon.spy()
let routerFake = sinon.fake.returns({})
let middlewareFake = sinon.fake.returns({})
let http = proxyquire('../../../../src/http', {
  'router': routerFake,
  './middleware': middlewareFake
})
let inv
let inventory
let get

test('Set up env', t => {
  t.plan(2)
  _inventory({ cwd: join(mock, 'normal') }, function (err, result) {
    if (err) t.fail(err)
    else {
      inventory = result
      inv = inventory.inv
      get = result.get
      t.ok(inv, 'Got inventory')
      t.ok(get, 'Got inventory getter')
    }
  })
})

test('http should return undefined unless @http, @ws or @static are defined', t => {
  t.plan(1)
  let i = JSON.parse(JSON.stringify(inventory))
  delete i.inv.http
  delete i.inv.static
  delete i.inv.ws
  t.equals(http(i), undefined, 'returned undefined with inventory with no http, static or ws')
})

test('http should return an app when only @http is defined', t => {
  t.plan(1)
  let i = JSON.parse(JSON.stringify(inventory))
  delete i.inv.static
  delete i.inv.ws
  t.notEquals(http(i), undefined, 'returned something with inventory with http')
})

test('http should return an app when only @static is defined', t => {
  t.plan(1)
  let i = JSON.parse(JSON.stringify(inventory))
  delete i.inv.http
  delete i.inv.ws
  t.notEquals(http(i), undefined, 'returned something with inventory with static')
})

test('http should return an app when only @ws is defined', t => {
  t.plan(1)
  let i = JSON.parse(JSON.stringify(inventory))
  delete i.inv.http
  delete i.inv.static
  t.notEquals(http(i), undefined, 'returned something with inventory with ws')
})
