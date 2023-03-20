let { join } = require('path')
let test = require('tape')
let sut = join(process.cwd(), 'src', 'arc', '_services')
let services = require(sut)

test('Services should populate with plugin variables', t => {
  t.plan(4)
  let pluginOne = () => ({ oneVar: 'yep' })
  let pluginTwo = () => ({ twoVar: 'yup' })
  pluginOne._plugin = 'pluginOne'
  pluginTwo._plugin = 'pluginTwo'
  let inventory = { inv: {
    app: 'testapp',
    _project: { arc: {} },
    plugins: { _methods: { deploy: { services: [
      pluginOne,
      pluginTwo,
    ]
    } } } } }
  services({ inventory }, (err, services) => {
    if (err) t.end(err)
    else {
      t.equal(Object.keys(services).length, 3, 'Got back two services (and one internal)')
      t.ok(services.ARC_SANDBOX, 'Got back internal SSM property')
      t.equal(services.pluginOne.oneVar, 'yep', 'First plugin variable created')
      t.equal(services.pluginTwo.twoVar, 'yup', 'Second plugin variable created')
    }
  })
})
