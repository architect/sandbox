exports.handler = async (event) => {
  let rando = {}
  let loops = 4000
  let arr = new Array(1000)
  for (let i = 0; i < loops; i++) {
    rando[i] = Array.from(arr, () => String.fromCharCode(0x0020 + Math.random() * 0x007F))
      .join('')
  }
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify(rando),
  }
}
