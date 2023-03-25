let { spawn } = require('child_process')
let { readdirSync } = require('fs')
let kill = require('tree-kill')
let errors = require('../../lib/errors')
let { invocations } = require('../../arc/_runtime-api')

module.exports = function spawnChild (params, callback) {
  let { args, context, cwd, command, lambda, options, requestID, timeout } = params
  let { apiType, update } = context
  let functionPath = options.cwd.replace(cwd, '').substr(1)
  let isInLambda = process.env.AWS_LAMBDA_FUNCTION_NAME
  let timedOut = false

  // Let's go!
  let child = spawn(command, args, options)
  let pid = child.pid
  let error
  let closed

  child.stdout.on('data', data => process.stdout.write('\n' + data))
  child.stderr.on('data', data => process.stderr.write('\n' + data))
  child.on('error', err => {
    error = err
    // Seen some non-string oob errors come via binary compilation
    if (err.code) shutdown('error')
  })
  child.on('close', (code, signal) => {
    update.debug.status(`${functionPath} (pid ${pid}) emitted 'close' (code '${code}', signal '${signal}')`)
    shutdown('child process closure')
  })

  // Set an execution timeout
  let to = setTimeout(function () {
    timedOut = true
    let duration = `${timeout / 1000}s`
    update.warn(`${functionPath} timed out after hitting its ${duration} timeout!`)
    shutdown(`${duration} timeout`)
  }, timeout)

  // Terminate once we find a result from the runtime API
  // 25ms is arbitrary, but hopefully it should be solid enough
  let check = setInterval(function () {
    if (invocations[requestID].response ||
        invocations[requestID].initError ||
        invocations[requestID].error) {
      shutdown('runtime API completion check')
    }
  }, 25)

  // Ensure we don't have dangling processes due to open connections, etc. before we wrap up
  function shutdown (event) {
    // Immediately shut down all timeouts and intervals
    clearTimeout(to)
    clearInterval(check)

    // Only ever begin the shutdown process once per execution
    if (closed) return
    closed = true

    update.debug.status(`${functionPath} (pid ${pid}) shutting down (via ${event})`)

    let completed = invocations[requestID].response ||
                    invocations[requestID].initError ||
                    invocations[requestID].error

    // Check if the process with specified PID is running or not
    // Stolen from: https://github.com/nisaacson/is-running/blob/master/index.js
    let isRunning = true
    try {
      // Signal 0 is a special node construct, see: https://nodejs.org/docs/latest-v14.x/api/process.html#process_process_kill_pid_signal
      isRunning = process.kill(pid, 0)
    }
    catch (err) {
      isRunning = err.code === 'EPERM'
    }

    // Wrap up here if we can verify the process is no longer running
    if (!isRunning) {
      update.debug.status(`${functionPath} (pid ${pid}) is not running (process closed: ${isRunning}; termination is not necessary)`)
      done(completed)
      return
    }

    // Ok, so the process is still running (which is totally normal!)
    update.debug.status(`${functionPath} (pid ${pid}) is still running, terminating now...`)
    if (error) {
      update.error(`${functionPath} (pid ${pid}) caught child process execution error`)
    }

    // Go ahead and respond to clients; process termination can continue in the background async
    done(completed)

    if (!isInLambda) {
      kill(pid, 'SIGINT', err => {
        if (err) {
          update.debug.status(`${functionPath} (pid ${pid}) tree-kill process termination error`)
          update.debug.raw(err)
        }
        else update.debug.status(`${functionPath} (pid ${pid}) successfully terminated`)
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
            update.debug.raw(err)
          }
        })
        update.debug.status(`${functionPath} (pid ${pid}) (possibly maybe) successfully terminated inside Lambda`)
      }
      catch (err) {
        update.debug.status(`${functionPath} (pid ${pid}) failed to terminate inside Lambda`)
        update.debug.raw(err)
      }
    }
  }

  // End execution
  function done (completed) {
    if (timedOut) {
      invocations[requestID].error = errors({
        lambdaError: {
          errorType: 'Timeout error',
          errorMessage: `<p>Lambda timed out after <b>${timeout / 1000} seconds</b></p>`,
        },
        lambda,
      })
    }
    else if (error) {
      invocations[requestID].error = errors({
        lambdaError: {
          errorType: `Function is missing or not defined, or unknown execution error`,
          errorMessage: `<p>${error}</p>`,
        },
        lambda,
      })
    }
    else if (![ 'http', 'httpv2' ].includes(apiType) && !completed) {
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
    }
    callback()
  }
}
