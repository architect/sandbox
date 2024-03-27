/* eslint @stylistic/js/semi: [ 'error', 'always' ] */
/* global Deno */
const { __ARC_CONFIG__, __ARC_CONTEXT__, AWS_LAMBDA_RUNTIME_API: runtimeAPI } = Deno.env.toObject();
const url = p => runtimeAPI + '/2018-06-01/runtime/' + p;
const headers = { 'content-type': 'application/json; charset=utf-8' };

(async function main () {
  try {
    const { handlerFile, handlerMethod } = JSON.parse(__ARC_CONFIG__);
    const context = JSON.parse(__ARC_CONTEXT__);
    Deno.env.delete('__ARC_CONFIG__');
    Deno.env.delete('__ARC_CONTEXT__');

    let isPromise = obj => obj && typeof obj.then === 'function';

    async function run () {
      const next = url('invocation/next');
      const response = await fetch(next);
      const event = await response.json();

      const requestID = response.headers.get('Lambda-Runtime-Aws-Request-Id') || response.headers.get('lambda-runtime-aws-request-id');
      const errorEndpoint = url('invocation/' + requestID + '/error');
      const responseEndpoint = url('invocation/' + requestID + '/response');

      const file = 'file://' + handlerFile;
      const mod = await import(file);
      const handler = mod[handlerMethod];

      async function callback (err, result) {
        if (err) {
          console.log(err);
          const errorMessage = err.message || '(unknown error)';
          const errorType = err.name || '(unknown error type)';
          const stackTrace = err.stack ? err.stack.split('\n') : undefined;
          const body = JSON.stringify({ errorMessage, errorType, stackTrace });
          await fetch(errorEndpoint, { method: 'POST', headers, body });
        }
        else {
          const options = { method: 'POST', headers };
          if (result) options.body = JSON.stringify(result);
          await fetch(responseEndpoint, options);
        }
      }
      try {
        const response = handler(event, context, callback);
        if (isPromise(response)) {
          response.then(result => callback(null, result)).catch(callback);
        }
      }
      catch (err) {
        callback(err);
      }
    }
    await run();
  }
  catch (err) {
    (async function initError () {
      const unknown = 'Unknown init error';
      console.log('Lambda init error:', err || unknown);
      const initErrorEndpoint = url('init/error');
      const errorMessage = err.message || unknown;
      const errorType = err.name || 'Unknown init error type';
      const stackTrace = err.stack ? err.stack.split('\n') : undefined;
      const body = JSON.stringify({ errorMessage, errorType, stackTrace });
      await fetch(initErrorEndpoint, { method: 'POST', headers, body });
    })();
  }
})();
