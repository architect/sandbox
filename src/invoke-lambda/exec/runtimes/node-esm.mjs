/* eslint @stylistic/js/semi: [ 'error', 'always' ] */
let { __ARC_CONFIG__, __ARC_CONTEXT__, AWS_LAMBDA_RUNTIME_API: runtimeAPI } = process.env;
let url = p => runtimeAPI + '/2018-06-01/runtime/' + p;

/* Lightweight HTTP client: older Node.js doesn't have fetch, and Lambda can't access global install deps */
import http from 'http';
let get = client.bind({}, 'GET');
let post = client.bind({}, 'POST');
let jsonType = 'application/json; charset=utf-8';
function client (method, params) {
  return new Promise((resolve, reject) => {
    let headers = method === 'GET'
      ? { accept: jsonType }
      : { 'content-type': jsonType };
    let body;
    if (method === 'POST' && params.body) {
      body = JSON.stringify(params.body);
      headers['content-length'] = Buffer.byteLength(body);
    }
    let req = http.request(params.url, { method, headers }, res => {
      let { statusCode } = res;
      if (statusCode < 200 || statusCode > 202) {
        return reject(Error('Runtime API error:', statusCode));
      }
      let raw = [];
      res.on('data', chunk => raw.push(chunk));
      res.on('end', () => {
        if (method === 'GET') {
          let body = Buffer.concat(raw).toString();
          try {
            resolve({
              headers: res.headers,
              body: JSON.parse(body),
            });
          }
          catch (err) {
            reject(err.message);
          }
        }
      });
    });
    req.on('error', err => {
      reject(err.message);
    });
    if (method === 'GET') req.end();
    else req.end(body, () => {
      resolve();
    });
  });
}

(async function main () {
  try {
    let { handlerFile, handlerMethod } = JSON.parse(__ARC_CONFIG__);
    let context = JSON.parse(__ARC_CONTEXT__);
    delete process.env.__ARC_CONFIG__;
    delete process.env.__ARC_CONTEXT__;

    let isPromise = obj => obj && typeof obj.then === 'function';

    async function run () {
      let next = url('invocation/next');
      let invocation = await get({ url: next });
      let { headers, body: event } = invocation;

      let requestID = headers['Lambda-Runtime-Aws-Request-Id'] || headers['lambda-runtime-aws-request-id'];
      let deadlineMS = headers['Lambda-Runtime-Deadline-Ms'] || headers['lambda-runtime-deadline-ms'];
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
          await post({ url: errorEndpoint, body });
        }
        else {
          await post({ url: responseEndpoint, body: result });
        }
      }
      try {
        function getRemainingTimeInMillis () { return Number(deadlineMS) - Date.now(); }
        context.getRemainingTimeInMillis = getRemainingTimeInMillis;
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
      let unknown = 'Unknown init error';
      console.log('Lambda init error:', err.body || err.message || unknown);
      let initErrorEndpoint = url('init/error');
      let errorMessage = err.message || unknown;
      let errorType = err.name || 'Unknown init error type';
      let stackTrace = err.stack ? err.stack.split('\n') : undefined;
      let body = { errorMessage, errorType, stackTrace };
      await post({ url: initErrorEndpoint, body });
    })();
  }
})();
