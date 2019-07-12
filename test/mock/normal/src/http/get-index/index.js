exports.handler = async function http() {
  return {
    headers: {'content-type': 'text/html; charset=utf8'},
    body: `Hello world!`
  }
}
