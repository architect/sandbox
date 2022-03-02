let { spawn } = require('child_process')
let { readdirSync } = require('fs')
let kill = require('tree-kill')
let { template } = require('../../lib')
let { head } = template
const SIG = 'SIGINT'
const arcStart = '__ARC__'
const arcEnd = '__ARC_END__'
const arcMetaStart = '__ARC_META__'
const arcMetaEnd = '__ARC_META_END__'

module.exports = function spawnChild (params, callback) {
  let { context, cwd, command, args, options, request, timeout } = params
  let { apiType, update } = context
  let functionPath = options.cwd.replace(cwd, '').substr(1)
  let isInLambda = process.env.AWS_LAMBDA_FUNCTION_NAME
  let timedout = false
  let printed = false
  let midArcOutput = false
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

    // Exit early if process isn't running, or we've already (started to) shut down
    if (!isRunning(pid) || murderInProgress || closed) {
      return update.debug.status(`${functionPath} (pid ${pid}) is not running (termination in progress: ${murderInProgress}; process closed: ${closed}`)
    }

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
        if (!closed) {
          done(code)
        }
      })
      return
    }
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
    if (!closed) {
      done(code)
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
    update.debug.status('Raw output:', stdout)
    /**
     * PSA: rarely, the invoked Lambda process has been observed to exit with non-corresponding codes
     * Example: a correct and complete stdout response has in certain circumstances been observed exit non-0 (and vice versa, see #1137)
     * Assuming exit codes may not be reliable: try parsing output (with the exit code) to determine successful completion
     */
    let get = str => stdout.split('\n').find(l => l.startsWith(str))
    let rawOut = get(arcStart)
    let rawMetaOut = get(arcMetaStart)
    let returned = rawOut && rawOut !== '__ARC__ undefined __ARC_END__'
    let result, meta
    if (returned) {
      let rawResult = rawOut
        .replace(arcStart, '')
        .replace(arcEnd, '')
        .trim()
      try {
        result = JSON.parse(rawResult)
      }
      catch (e) {
        update.status(`Parsing error! ${functionPath} output followed by exception: `, rawResult, JSON.stringify(e, null, 2))
      }
    }
    // If the runtime fails super hard, the child may exit without any stdout/stderr/err
    if (rawMetaOut) {
      let rawMeta = rawMetaOut
        .replace(arcMetaStart, '')
        .replace(arcMetaEnd, '')
        .trim()
      try {
        meta = JSON.parse(rawMeta)
      }
      catch (e) {
        update.status(`Parsing error! ${functionPath} meta output followed by exception: `, rawMeta, JSON.stringify(e, null, 2))
      }
    }

    clearTimeout(to) // ensure the timeout doesn't block
    if (timedout) {
      return callback(null, {
        statusCode: 500,
        headers,
        body: `${head}<h1>Timeout Error</h1>
        <p>Lambda <code>${functionPath}</code> timed out after <b>${timeout / 1000} seconds</b></p>`
      }, meta)
    }
    if (error) {
      return callback(null, {
        statusCode: 502,
        headers,
        body: `${head}<h1>Requested function is missing or not defined, or unknown error</h1>
        <p>${error}</p>
        `
      }, meta)
    }
    if (code === 0 || returned) {
      if (!returned && apiType === 'http') {
        return callback(null, undefined, meta)
      }
      if (result) {
        // If it's an error pretty print it
        if (result.name && result.message && result.stack) {
          let body = `${head}
          <h1>${result.name}</h1>
          <p>${result.message}</p>
          <pre>${result.stack}</pre>
          `
          return callback(null, {
            statusCode: 500,
            headers,
            body,
          }, meta)
        }
        // otherwise just return the command line
        return callback(null, result, meta)
      }

      return callback(null, {
        statusCode: 500,
        headers,
        body: `${head}<h1>Async error</h1>
<p><strong>Lambda <code>${functionPath}</code> ran without executing the completion callback or returning a value.</strong></p>

<p>Dependency-free functions, or functions that use <code>@architect/functions arc.http.async()</code> must return a correctly formatted response object.</p>

<p>Functions that utilize <code>@architect/functions arc.http()</code> must ensure <code>res</code> gets called</p>

<p>Learn more about <a href="https://arc.codes/primitives/http">dependency-free responses</a>, or about using <code><a href="https://arc.codes/reference/functions/http/node/classic">arc.http()</a></code> and <code><a href="https://arc.codes/reference/functions/http/node/async">arc.http.async()</a></code></p>.
          `
      }, meta)
    }
    return callback(null, {
      statusCode: 500,
      headers,
      body: `${head}<h1>Error</h1>
        <p>Process exited with ${code}<p>
        <pre>${stdout}</pre>
        <pre>${stderr}</pre>`
    }, meta)
  }

  child.stdout.on('data', data => {
    // always capture data piped to stdout
    // always look for __ARC_META__ first
    stdout += data
    if (data.includes(arcMetaStart)) {
      let out = data.toString().split(arcMetaStart)
      if (out[0]) {
        printed = true
        process.stdout.write(out[0])
      }
      midArcOutput = true
    }
    if (data.includes(arcEnd)) {
      midArcOutput = false
      maybeShutdown('stdout')
      return
    }
    if (midArcOutput) {
      return
    }
    if (!printed) console.log() // Break between invocations
    if (data) printed = true
    process.stdout.write(data)
  })

  child.stderr.on('data', data => {
    stderr += data
    if (!printed) console.log() // Break between invocations
    if (data) printed = true
    process.stderr.write(data)
    if (data.includes(arcEnd)) {
      maybeShutdown('stderr')
    }
  })

  child.on('error', err => {
    error = err
    // Seen some non-string oob errors come via binary compilation
    if (err.includes?.(arcEnd) || err.code) {
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
