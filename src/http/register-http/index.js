let invoker = require('../invoke-http')

module.exports = function reg (app, params) {
  let { apiType, inventory, update } = params

  let sortRoutes =  inventory.inv.http.map((route, index) => {
    let path = route.path
    let parts = path.split('/').slice(1)
    console.log(parts)
    function weight (str) {
      if (str === '*') return 1 // wild
      if (/^\:/.test(str)) return 2 // param
      return 3 // static
    }
    function specificity (arr){
      let spec = 0
      let place = 1000000
      for (let i = 0; i < arr.length; i++) {
        spec += weight(arr[i]) * place
        place = Math.round(Number(place) / 10)
      }
      return spec
    }
    return { path: route.path, index, specificity: specificity(parts) }
  }).sort((a, b) => (a.specificity < b.specificity) ? 1 : -1)
  console.log(sortRoutes)
    

  // inventory.inv.http.forEach(lambda => {
  sortRoutes.forEach(i => {
    let lambda = inventory.inv.http[i.index]
    // ASAP handled by middleware
    if (lambda.arcStaticAssetProxy) return
    let { method, path } = lambda

    // Methods not implemented by Arc for legacy REST APIs
    if (apiType === 'rest') {
      let httpOnly = [ 'any', 'head', 'options' ]
      let hasCatchall = path.includes('*')
      if (!httpOnly.includes(method) && !hasCatchall) {
        let exec = invoker({ lambda, ...params })
        app[method](path, exec)
      }
    }
    else {
      // Register the route with the Router instance
      let exec = invoker({ lambda, ...params })
      if (method !== 'any') {
        app[method](path, exec)
      }
      // In the case of `any`, register all methods
      else {
        let methods = [ 'get', 'post', 'put', 'patch', 'head', 'delete', 'options' ]
        for (let method of methods) {
          app[method](path, exec)
        }
      }
    }
  })

  update.done(`@http server started`)
}
