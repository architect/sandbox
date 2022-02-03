let { join } = require('path')
let test = require('tape')
let sut = join(process.cwd(), 'src', 'arc', '_services')
let services = require(sut)

test('Services should populate with plugin variables', t => {
  t.plan(3)
  let pluginOne = () => ({ oneVar: 'yep' })
  let pluginTwo = () => ({ twoVar: 'yup' })
  pluginOne.plugin = 'pluginOne'
  pluginTwo.plugin = 'pluginTwo'
  let inventory = { inv: {
    app: 'testapp',
    _project: { arc: {} },
    plugins: { _methods: { deploy: { services: [
      pluginOne,
      pluginTwo,
    ]
    } } } } }
  services({ inventory }, (err, services) => {
    if (err) t.fail(err)
    else {
      t.equal(Object.keys(services).length, 2, 'Got back two services')
      t.equal(services.pluginOne.oneVar, 'yep', 'First plugin variable created')
      t.equal(services.pluginTwo.twoVar, 'yup', 'Second plugin variable created')
    }
  })
})
