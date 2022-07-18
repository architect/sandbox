let { Buffer } = require('buffer')
let {
  gzipSync,
  gunzipSync,
  brotliCompressSync,
  brotliDecompressSync,
  deflateSync,
  inflateSync,
} = require('zlib')

module.exports = function autoreloadifier (res, body, ports) {
  let headers = res.getHeaders()
  let type = headers['content-type'] || headers['Content-Type']

  // We only care about HTML
  if (!type?.includes('text/html')) return res.end(body)

  // Maybe decompress
  let encoding = headers['content-encoding'] || headers['Content-Encoding']
  let compression = checkEncoding(encoding)
  body = decompress(compression, body)
  // HTML via ASAP passes base64-encoded string -> buffer
  if (Buffer.isBuffer(body)) {
    body = body.toString()
  }
  let script = _script(ports._arc)
  body = body.replace(head, script)
  // Maybe recompress on the way out
  body = compress(compression, body)
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

let checkEncoding = enc => enc && [ 'gzip', 'deflate', 'br' ].includes(enc) ? enc : 'none'
// ASAP's (de)compressor
function compressor (direction, type, body) {
  let compress = direction === 'compress'
  let exec = {
    gzip: compress ? gzipSync : gunzipSync,
    br: compress ? brotliCompressSync : brotliDecompressSync,
    deflate: compress ? deflateSync : inflateSync
  }
  if (!exec[type]) return body

  return exec[type](body)
}
let compress = compressor.bind({}, 'compress')
let decompress = compressor.bind({}, 'decompress')
