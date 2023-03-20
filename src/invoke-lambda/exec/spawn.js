let { spawn } = require('child_process')
let { readdirSync } = require('fs')
let kill = require('tree-kill')
let errors = require('./errors')
const SIG = 'SIGINT'

module.exports = function spawnChild (params, callback) {
  let { args, context, cwd, command, invocations, lambda, options, requestID, timeout } = params
  let { apiType, update } = context
  let functionPath = options.cwd.replace(cwd, '').substr(1)
  let isInLambda = process.env.AWS_LAMBDA_FUNCTION_NAME
  let timedOut = false

  // Let's go
  let child = spawn(command, args, options)
  let pid = child.pid
  let error
  let murderInProgress
  let closed

  // Check if the process with specified PID is running or not
  // Stolen from: https://github.com/nisaacson/is-running/blob/master/index.js
  function isRunning (pid) {
    let isRunning
    try {
      // Signal 0 is a special node construct, see: https://nodejs.org/docs/latest-v14.x/api/process.html#process_process_kill_pid_signal
      isRunning = process.kill(pid, 0)
    }
    catch (err) {
      isRunning = err.code === 'EPERM'
    }
    return isRunning
  }

  // Ensure we don't have dangling processes due to open connections, etc.
  function maybeShutdown (event) {
    update.debug.status(`${functionPath} (pid ${pid}) shutting down (via ${event} event)`)

    // Exit early if process isn't running, or we've already (started to) shut down
    if (!isRunning(pid) || murderInProgress || closed) {
      let msg = `${functionPath} (pid ${pid}) is not running (termination in progress: ${murderInProgress}; process closed: ${closed})`
      return update.debug.status(msg)
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
    timedOut = true
    let duration = `${timeout / 1000}s`
    update.warn(`${functionPath} timed out after hitting its ${duration} timeout!`)
    maybeShutdown(`${duration} timeout`)
  }, timeout)

  // Terminate once we find a result from the runtime API
  // 25ms is arbitrary, but hopefully it should be solid enough
  let check = setInterval(function () {
    if (invocations[requestID].response ||
        invocations[requestID].initError ||
        invocations[requestID].error) {
      maybeShutdown('completion')
    }
  }, 25)

  // End execution
  function done () {
    // Only ever run once per execution
    if (closed) return
    closed = true
    clearTimeout(to) // Ensure the timeout doesn't block
    clearInterval(check)

    if (timedOut) {
      invocations[requestID].error = errors({
        lambdaError: {
          errorType: 'Timeout error',
          errorMessage: `<p>Lambda timed out after <b>${timeout / 1000} seconds</b></p>`,
        },
        lambda,
      })
      return callback()
    }
    if (error) {
      invocations[requestID].error = errors({
        lambdaError: {
          errorType: `Function is missing or not defined, or unknown execution error`,
          errorMessage: `<p>${error}</p>`,
        },
        lambda,
      })
      return callback()
    }

    let completed = invocations[requestID].response ||
                    invocations[requestID].initError ||
                    invocations[requestID].error
    if (completed || (!completed && apiType === 'http')) {
      return callback()
    }
    else {
      invocations[requestID].error = errors({
        lambdaError: {
          errorType: `No response found`,
          errorMessage: `Lambda did not execute the completion callback or return a value`,
          additional: `Dependency-free functions, or functions that use <code>@architect/functions arc.http.async()</code> must return a correctly formatted response object.</p>

<p>Functions that utilize <code>@architect/functions arc.http()</code> must ensure <code>res</code> gets called</p>

<p>Learn more about <a href="https://arc.codes/primitives/http">dependency-free responses</a>, or about using <code><a href="https://arc.codes/reference/functions/http/node/classic">arc.http()</a></code> and <code><a href="https://arc.codes/reference/functions/http/node/async">arc.http.async()</a></code>.`,
        },
        lambda,
      })
      return callback()
    }
  }

  child.stdout.on('data', data => process.stdout.write('\n' + data))
  child.stderr.on('data', data => process.stderr.write('\n' + data))
  child.on('error', err => {
    error = err
    // Seen some non-string oob errors come via binary compilation
    if (err.code) maybeShutdown('error')
  })
  child.on('close', (code, signal) => {
    update.debug.status(`${functionPath} (pid ${pid}) emitted 'close' (code '${code}', signal '${signal}')`)
    done()
  })
}
