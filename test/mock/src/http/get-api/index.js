let data = require('@architect/data')

exports.handler = async function http(req) {
  let results = await data.cats.scan({})
  return {
    body: JSON.stringify(results)
  }  
}
