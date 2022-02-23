let { Buffer } = require('buffer')

module.exports = function autoreloadifier (res, body, ports) {
  let headers = res.getHeaders()
  let type = headers['content-type'] || headers['Content-Type']
  if (!type?.includes('text/html') || !body?.includes(head)) {
    return res.end(body)
  }
  let script = _script(ports._arc)
  // HTML via ASAP passes base64-encoded string -> buffer
  if (Buffer.isBuffer(body)) {
    body = body.toString()
  }
  body = body.replace(head, script)
  // We don't have to update 'content-length' as API Gateway always drops it
  res.end(body)
}

let head = '</head>'
let _script = port => /* html */`<script>
  (() => {
    const url = 'ws://localhost:${port}'
    let socket = new WebSocket(url)
    socket.addEventListener('message', message => {
      if (message.data === 'reload') location.reload()
    })
    socket.addEventListener('close', ({ wasClean }) => {
      const retryMs = 1000
      const cancelMs = 5000
      const maxAttempts = Math.round(cancelMs / retryMs)
      let attempts = 0
      const reloadIfCanConnect = () => {
        attempts++
        if (attempts > maxAttempts){
          console.error('Could not reconnect to dev server.')
          return
        }
        socket = new WebSocket(url)
        socket.addEventListener('error', () => {
          setTimeout(reloadIfCanConnect, retryMs)
        })
        socket.addEventListener('open', () => {
          if (!wasClean) {
            location.reload()
          }
        })
      }
      reloadIfCanConnect()
    })
  })();
</script>
</head>`
