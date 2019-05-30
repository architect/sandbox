// learn more about http functions here: https://arc.codes/guides/background-tasks 
exports.handler = async function subscribe(payload) {
  console.log('hit-event', JSON.stringify(payload, null, 2))
  return
}
