let { spawn } = require('child_process')
let { readdirSync } = require('fs')
let kill = require('tree-kill')
let { template } = require('../lib')
let { head } = template
const SIG = 'SIGINT'

module.exports = function spawnChild (params, callback) {
  let { cwd, command, args, options, request, timeout, update } = params
  let functionPath = options.cwd.replace(cwd, '').substr(1)
  let isInLambda = process.env.AWS_LAMBDA_FUNCTION_NAME
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
  let pid = child.pid
  let stdout = ''
  let stderr = ''
  let error
  let murderInProgress
  let closed

  if (!isDeno) {
    child.stdin.setEncoding('utf-8')
    child.stdin.write(request + '\n')
    child.stdin.end()
  }

  // Check if the process with specified PID is running or not
  // Stolen from: https://github.com/nisaacson/is-running/blob/master/index.js
  function isRunning (pid) {
    let isRunning
    try {
      // Signal 0 is a special node construct, see: https://nodejs.org/docs/latest-v14.x/api/process.html#process_process_kill_pid_signal
      isRunning = process.kill(pid, 0)
    }
    catch (e) {
      isRunning = e.code === 'EPERM'
    }
    return isRunning
  }

  // Ensure we don't have dangling processes due to open connections, etc.
  function maybeShutdown (event) {
    update.debug.status(`${functionPath} (pid ${pid}) shutting down (via ${event} event)`)
    if (isRunning(pid) && !murderInProgress && !closed) {
      update.debug.status(`${functionPath} (pid ${pid}) is still running, terminating now...`)
      murderInProgress = true
      let code = 0
      if (error) {
        update.error(`${functionPath} (pid ${pid}) caught hanging execution with an error, attempting to exit 1`)
        code = 1
      }
      if (!isInLambda) {
        kill(pid, SIG, () => {
          murderInProgress = false
          update.debug.status(`${functionPath} (pid ${pid}) successfully terminated`)
          if (!closed) done(code)
        })
      }
      else {
        // tree-kill relies on *nix `ps`, which Lambda doesn't have – but it does have /proc
        // Node process.kill() + Lambda Linux /proc/<pid>/task/<tid> is mysterious, so this may not be the best or proper approach
        try {
          let tasks = readdirSync(`/proc/${pid}/task`)
          tasks.forEach(tid => {
            try { process.kill(tid) }
            catch (err) {
              // Task may have ended naturally or been killed by killing child.pid, I guess we don't really know
              update.debug.status(`${functionPath} (pid ${pid}) did not kill task (tid ${tid})`)
            }
          })
          update.debug.status(`${functionPath} (pid ${pid}) (possibly maybe) successfully terminated inside Lambda`)
        }
        catch (err) {
          update.debug.status(`${functionPath} (pid ${pid}) failed to terminate inside Lambda: ${err.message}`)
        }
        murderInProgress = false
        if (!closed) done(code)
      }
    }
    else {
      update.debug.status(`${functionPath} (pid ${pid}) is not running (termination in progress: ${murderInProgress}; process closed: ${closed}`)
    }
  }

  // Set an execution timeout
  let to = setTimeout(function () {
    timedout = true
    let duration = `${timeout / 1000}s`
    update.warn(`${functionPath} timed out after hitting its ${duration} timeout!`)
    maybeShutdown(`${duration} timeout`)
  }, timeout)

  // End execution
  function done (code) {
    // Only ever run once per execution
    if (closed) return
    closed = true
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
    /**
     * PSA: rarely, the invoked Lambda process has been observed to exit with non-corresponding codes
     * Example: a correct and complete stdout response has in certain circumstances been observed exit non-0 (and vice versa, see #1137)
     * Assuming exit codes may not be reliable: try parsing output (with the exit code) to determine successful completion
     */
    // Ok, now extract the __ARC__ ... __ARC_END__ line
    let command = line => line.startsWith('__ARC__')
    let result = stdout.split('\n').find(command)
    let returned = result && result !== '__ARC__ undefined __ARC_END__'
    let apiType = process.env.ARC_API_TYPE
    let parsed
    if (returned) {
      let raw = result
        .replace('__ARC__', '')
        .replace('__ARC_END__', '')
        .trim()
      try {
        parsed = JSON.parse(raw)
      }
      catch (e) {
        update.status(`${functionPath} parsing JSON stdout error! Raw parsed input followed by exception: `, raw, JSON.stringify(e, null, 2))
      }
    }

    clearTimeout(to) // ensure the timeout doesn't block
    if (timedout) {
      callback(null, {
        statusCode: 500,
        headers,
        body: `${head}<h1>Timeout Error</h1>
        <p>Lambda <code>${functionPath}</code> timed out after <b>${timeout / 1000} seconds</b></p>`
      })
    }
    else if (error) {
      callback(null, {
        statusCode: 502,
        headers,
        body: `${head}<h1>Requested function is missing or not defined, or unknown error</h1>
        <p>${error}</p>
        `
      })
    }
    else if (code === 0 || returned) {
      if (!returned && apiType === 'http') {
        callback()
      }
      else if (parsed) {
        // If it's an error pretty print it
        if (parsed.name && parsed.message && parsed.stack) {
          parsed.body = `${head}
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
          body: `${head}<h1>Async error</h1>
<p><strong>Lambda <code>${functionPath}</code> ran without executing the completion callback or returning a value.</strong></p>

<p>Dependency-free functions, or functions that use <code>@architect/functions arc.http.async()</code> must return a correctly formatted response object.</p>

<p>Functions that utilize <code>@architect/functions arc.http()</code> must ensure <code>res</code> gets called</p>

<p>Learn more about <a href="https://arc.codes/primitives/http">dependency-free responses</a>, or about using <code><a href="https://arc.codes/reference/functions/http/node/classic">arc.http()</a></code> and <code><a href="https://arc.codes/reference/functions/http/node/async">arc.http.async()</a></code></p>.
          `
        })
      }
    }
    else {
      callback(null, {
        statusCode: 500,
        headers,
        body: `${head}<h1>Error</h1>
        <p>Process exited with ${code}<p>
        <pre>${stdout}</pre>
        <pre>${stderr}</pre>`
      })
    }
  }

  child.stdout.on('data', data => {
    // always capture data piped to stdout
    // python buffers so you might get everything despite our best efforts
    stdout += data
    if (data.includes('__ARC_END__')) {
      maybeShutdown('stdout')
    }
  })

  child.stderr.on('data', data => {
    stderr += data
    if (data.includes('__ARC_END__')) {
      maybeShutdown('stderr')
    }
  })

  child.on('error', err => {
    error = err
    if (err.includes('__ARC_END__')) {
      maybeShutdown('error')
    }
  })

  child.on('exit', (code, signal) => {
    update.debug.status(`${functionPath} (pid ${pid}) emitted 'exit' (code '${code}', signal '${signal}')`)
    done(code)
  })

  child.on('close', (code, signal) => {
    update.debug.status(`${functionPath} (pid ${pid}) emitted 'close' (code '${code}', signal '${signal}')`)
    done(code)
  })
}
