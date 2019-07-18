exports.handler = async function subscribe(payload) {
  console.log('hit queue', JSON.stringify(payload, null, 2))
  return
}
