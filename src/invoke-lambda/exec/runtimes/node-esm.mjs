/* eslint semi: [ 'error', 'always' ] */
let { __ARC_CONFIG__, __ARC_CONTEXT__, AWS_LAMBDA_RUNTIME_API: runtimeAPI } = process.env;
let url = p => runtimeAPI + '/2018-06-01/runtime/' + p;

(async function main () {
  try {
    let { apiType, handlerFile, handlerMethod } = JSON.parse(__ARC_CONFIG__);
    let context = JSON.parse(__ARC_CONTEXT__);
    delete process.env.__ARC_CONFIG__;
    delete process.env.__ARC_CONTEXT__;

    let isPromise = obj => obj && typeof obj.then === 'function';

    async function run (){
      let _tiny = await import('tiny-json-http');
      let tiny = _tiny.default;

      let next = url('invocation/next');
      let invocation = await tiny.get({ url: next });
      let { headers, body: event } = invocation;

      let requestID = headers['Lambda-Runtime-Aws-Request-Id'] || headers['lambda-runtime-aws-request-id'];
      let errorEndpoint = url('invocation/' + requestID + '/error');
      let responseEndpoint = url('invocation/' + requestID + '/response');

      let file = 'file://' + handlerFile;
      let mod = await import(file);
      let handler = mod[handlerMethod];

      async function callback (err, result) {
        if (err) {
          console.log(err);
          let errorMessage = err.message || '(unknown error)';
          let errorType = err.name || '(unknown error type)';
          let stackTrace = err.stack ? err.stack.split('\n') : undefined;
          let body = { errorMessage, errorType, stackTrace };
          await tiny.post({ url: errorEndpoint, body });
        }
        /* As of tiny 7.5, falsy bodies result in posting an empty object (which is a false positive), so in that specific case we need to not publish a response */
        else if (result || apiType === 'http') {
          if (!result) result = 'null';
          await tiny.post({ url: responseEndpoint, body: result });
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
      let _tiny = await import('tiny-json-http');
      let tiny = _tiny.default;
      console.log(err);
      let initErrorEndpoint = url(`init/error`);
      let errorMessage = err.message || 'Unknown init error';
      let errorType = err.name || 'Unknown init error type';
      let stackTrace = err.stack ? err.stack.split('\n') : undefined;
      let body = { errorMessage, errorType, stackTrace };
      await tiny.post({ url: initErrorEndpoint, body });
    })();
  }
})();
