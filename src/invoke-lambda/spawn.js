let { updater } = require('@architect/utils')
let { spawn } = require('child_process')
let kill = require('tree-kill')

module.exports = function spawnChild (command, args, options, request, timeout, callback) {
  let cwd = options.cwd
  let timedout = false
  let headers = {
    'content-type': 'text/html; charset=utf8;',
    'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0'
  }

  // deno's stdin interfaces were wonky and unstable at the time of impl
  // we're routing around it until they stabilize / become friendly
  let isDeno = command === 'deno'
  if (isDeno) {
    options.env.__ARC_REQ__ = request
  }

  // run the show
  let child = spawn(command, args, options)
  let stdout = ''
  let stderr = ''
  let error
  let closed = false

  if (!isDeno) {
    child.stdin.setEncoding('utf-8')
    child.stdin.write(request + '\n')
    child.stdin.end()
  }

  // Ensure we don't have dangling processes due to open connections, etc.
  function maybeShutdown () {
    if (closed) {null} // noop
    else {
      // Wait for 50ms for a proper close, otherwise assume the process is hung
      setTimeout(() => {
        if (closed) {null} // Check one last time for graceful shutdown
        else {
          if (error) {
            let update = updater('Sandbox')
            update.error('Caught hanging execution with an error, attempting to exit 1')
            kill(child.pid)
            closed = true
            done(1)
          }
          else {
            kill(child.pid)
            closed = true
            done(0)
          }
        }
      }, 50)
    }
  }

  // Set an execution timeout
  let to = setTimeout(function () {
    timedout = true
    closed = true
    kill(child.pid)
    done(1)
  }, timeout)

  // End execution
  function done (code) {
    // Output any console logging from the child process
    let tidy = stdout.toString()
      .split('\n')
      .filter(line => !line.startsWith('__ARC__'))
      .join('\n')
    if (tidy.length > 0) {
      console.log(tidy)
    }
    if (stderr) {
      console.error(stderr)
    }

    clearTimeout(to) // ensure the timeout doesn't block
    if (timedout) {
      callback(null, {
        statusCode: 500,
        headers,
        body: `<h1>Timeout Error</h1>
        <p>Lambda <code>${cwd}</code> timed out after <b>${timeout / 1000} seconds</b></p>`
      })
    }
    else if (error) {
      callback(null, {
        statusCode: 502,
        headers,
        body: `<h1>Requested function is missing or not defined, or unknown error</h1>
        <p>${error}</p>
        `
      })
    }
    else if (code === 0) {
      // Extract the __ARC__ line
      let command = line => line.startsWith('__ARC__')
      let result = stdout.split('\n').find(command)
      let returned = result && result !== '__ARC__ undefined __ARC_END__'
      let apiType = process.env.ARC_API_TYPE
      if (!returned && apiType === 'http') {
        callback()
      }
      else if (returned) {
        let raw = result
          .replace('__ARC__', '')
          .replace('__ARC_END__', '')
          .trim()
        let parsed = JSON.parse(raw)
        // If it's an error pretty print it
        if (parsed.name && parsed.message && parsed.stack) {
          parsed.body = `
          <h1>${parsed.name}</h1>
          <p>${parsed.message}</p>
          <pre>${parsed.stack}</pre>
          `
          parsed.code = 500
          parsed.type = 'text/html'
        }
        // otherwise just return the command line
        callback(null, parsed)
      }
      else {
        callback(null, {
          statusCode: 500,
          headers,
          body: `<h1>Async error</h1>
<p><strong>Lambda <code>${cwd}</code> ran without executing the completion callback or returning a value.</strong></p>

<p>Dependency-free functions, or functions that use <code>@architect/functions arc.http.async()</code> must return a correctly formatted response object.</p>

<p>Functions that utilize <code>@architect/functions arc.http()</code> must ensure <code>res</code> gets called</p>

<p>Learn more about <a href="https://arc.codes/primitives/http">dependency-free responses</a>, or about using <code><a href="https://arc.codes/reference/functions/http/node/classic">arc.http()</a></code> and <code><a href="https://arc.codes/reference/functions/http/node/async">arc.http.async()</a></code></p>.
          `
        })
      }
    }
    else {
      callback(null, { headers, body: `<pre>${code}...${stdout}</pre><pre>${stderr}</pre>` })
    }
  }

  child.stdout.on('data', data => {
    // always capture data piped to stdout
    // python buffers so you might get everything despite our best efforts
    stdout += data
    if (data.includes('__ARC_END__'))
      maybeShutdown()
  })

  child.stderr.on('data', data => {
    stderr += data
    if (data.includes('__ARC_END__'))
      maybeShutdown()
  })

  child.on('error', err => {
    error = err
    if (err.includes('__ARC_END__'))
      maybeShutdown()
  })

  child.on('close', function close (code) {
    if (closed) {null} // Hung process was caught and shut down
    else {
      closed = true
      done(code)
    }
  })
}
