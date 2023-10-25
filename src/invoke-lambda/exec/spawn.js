let { spawn } = require('child_process')
let { readdirSync } = require('fs')
let kill = require('tree-kill')
let errors = require('../../lib/errors')
let { invocations } = require('../../arc/_runtime-api')

module.exports = function spawnChild (params, callback) {
  let { args, coldstart, context, command, lambda, options, requestID, timeout } = params
  let { apiType, update } = context
  let isInLambda = process.env.AWS_LAMBDA_FUNCTION_NAME
  let timedOut = false

  // Let's go!
  let pid = 'init'
  let child, error, closed, to, check
  function start () {
    child = spawn(command, args, options)
    pid = child.pid

    child.stdout.on('data', data => process.stdout.write('\n' + data))
    child.stderr.on('data', data => process.stderr.write('\n' + data))
    child.on('error', err => {
      error = err
      // Seen some non-string oob errors come via binary compilation
      if (err.code) shutdown('error')
    })
    child.on('close', (code, signal) => {
      update.debug.status(`[${requestID}] Emitted 'close' (pid ${pid}, code '${code}', signal '${signal}')`)
      shutdown('child process closure')
    })

    // Set an execution timeout
    to = setTimeout(function () {
      timedOut = true
      let duration = `${timeout / 1000}s`
      update.warn(`[${requestID}] Timed out after hitting its ${duration} timeout!`)
      shutdown(`${duration} timeout`)
    }, timeout)

    // Terminate once we find a result from the runtime API
    // 25ms is arbitrary, but hopefully it should be solid enough
    check = setInterval(function () {
      if (invocations[requestID].response ||
          invocations[requestID].initError ||
          invocations[requestID].error) {
        shutdown('runtime API completion check')
      }
    }, 25)
  }
  if (coldstart) setTimeout(start, coldstart)
  else start()

  // Ensure we don't have dangling processes due to open connections, etc. before we wrap up
  function shutdown (event) {
    // Immediately shut down all timeouts and intervals
    clearTimeout(to)
    clearInterval(check)

    // Only ever begin the shutdown process once per execution
    if (closed) return
    closed = true

    update.debug.status(`[${requestID}] Shutting down (pid ${pid}, via ${event})`)

    // Check if the process with specified PID is running or not
    // Stolen from: https://github.com/nisaacson/is-running/blob/master/index.js
    let isRunning = true
    try {
      // Signal 0 is a special node construct, see: https://nodejs.org/docs/latest-v14.x/api/process.html#process_process_kill_pid_signal
      isRunning = pid === 'init' ? false : process.kill(pid, 0)
    }
    catch (err) {
      isRunning = err.code === 'EPERM'
    }

    // Wrap up here if we can verify the process is no longer running
    if (!isRunning) {
      update.debug.status(`[${requestID}] Process is no longer running (pid ${pid}, process closed: ${isRunning}; termination is not necessary)`)
      done()
      return
    }

    // Ok, so the process is still running (which is totally normal!)
    update.debug.status(`[${requestID}] Process is still running, terminating pid ${pid} now...`)
    if (error) {
      update.error(`[${requestID}] Caught child process execution error (pid ${pid})`)
    }

    let isTesting = process.env.CI || process.env.NODE_ENV === 'testing'
    // During testing/CI, the server is constantly being started and stopped
    // This may create race conditions for compiled Lambdae, which may request the `/next` runtime API endpoint only to discover the Sandbox has already shut down
    // Under normal end-user circumstances, we can go ahead and respond to clients immediately while Lambda process termination carries on in the background
    if (!isTesting) {
      done()
    }

    if (!isInLambda) {
      kill(pid, 'SIGINT', err => {
        if (err) {
          update.debug.status(`[${requestID}] tree-kill process termination error (pid ${pid})`)
          update.debug.raw(err)
        }
        else update.debug.status(`[${requestID}] Successfully terminated process (pid ${pid})`)
        // If we're in CI, it's best to wait for processes to terminate, even if slightly slower
        if (isTesting) done()
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
            update.debug.status(`[${requestID}] Did not kill task (pid ${pid}, tid ${tid})`)
            update.debug.raw(err)
          }
        })
        update.debug.status(`[${requestID}] Process (probably) successfully terminated inside Lambda (pid ${pid})`)
        // If we're in CI, it's best to wait for processes to terminate, even if slightly slower
        if (isTesting) done()
      }
      catch (err) {
        update.debug.status(`[${requestID}] Failed to terminate process inside Lambda (pid ${pid})`)
        update.debug.raw(err)
      }
    }
  }

  // End execution
  function done () {
    let requiresResponse = false
    if (lambda.pragma === 'ws' ||
        (lambda.pragma === 'http' && ![ 'http', 'httpv2' ].includes(apiType))) {
      requiresResponse = true
    }

    let completed = invocations[requestID].response ||
                    invocations[requestID].initError ||
                    invocations[requestID].error
    if (timedOut) {
      let type = 'Timeout error'
      invocations[requestID].error = `${type}: Lambda timed out after ${timeout / 1000} seconds`
      invocations[requestID].response = errors({
        lambdaError: {
          errorType: type,
          errorMessage: `<p>Lambda timed out after <b>${timeout / 1000} seconds</b></p>`,
        },
        lambda,
      })
    }
    else if (error) {
      let type = 'Function is missing or not defined, or unknown execution error'
      invocations[requestID].error = `${type}: ${error}`
      invocations[requestID].response = errors({
        lambdaError: {
          errorType: type,
          errorMessage: `<p>${error}</p>`,
        },
        lambda,
      })
    }
    else if (requiresResponse && !completed) {
      let type = 'No response found'
      let msg = 'Lambda did not execute the completion callback or return a value'
      invocations[requestID].error = `${type}: ${msg}`
      invocations[requestID].response = errors({
        lambdaError: {
          errorType: type,
          errorMessage: msg,
          additional: `Dependency-free functions, or functions that use <code>@architect/functions arc.http()</code> must return a correctly formatted response object.</p>

<p>Functions that utilize <code>@architect/functions arc.http()</code> must ensure <code>res</code> gets called</p>

<p>Learn more about <a href="https://arc.codes/primitives/http">dependency-free responses</a>, or about using <code><a href="https://arc.codes/reference/functions/http/node/classic">arc.http()</a></code> and <code><a href="https://arc.codes/reference/functions/http/node/async">arc.http()</a></code>.`,
        },
        lambda,
      })
    }
    callback()
  }
}
