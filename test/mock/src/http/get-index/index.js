let data = require('@architect/data')

exports.handler = async function http(req) {
  let results = await data.cats.scan({})
  return {
    headers: {'content-type': 'text/html; charset=utf8'}, 
    body: `
<h1>hello world</h1>

<form action=/ping/baz method=post>
  <button type=submit>ping</button>
</form>

<form action=/pong/buzz method=post>
  <button type=submit>pong</button>
</form>

<hr>
<pre>${JSON.stringify(results, null, 2)}</pre>
`
  }
}
