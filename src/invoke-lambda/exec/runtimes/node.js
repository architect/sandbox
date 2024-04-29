/* eslint @stylistic/js/semi: [ 'error', 'always' ] */
let { __ARC_CONFIG__, __ARC_CONTEXT__, AWS_LAMBDA_RUNTIME_API: runtimeAPI } = process.env;
let url = p => runtimeAPI + '/2018-06-01/runtime/' + p;

/* Lightweight HTTP client: older Node.js doesn't have fetch, and Lambda can't access global install deps */
let http = require('http');
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
    let { projectSrc, handlerFile, handlerMethod, shared, views } = JSON.parse(__ARC_CONFIG__);
    let context = JSON.parse(__ARC_CONTEXT__);
    let { join, sep } = require('path');
    let { existsSync: exists, readFileSync: read } = require('fs');
    let cwd = process.cwd();
    delete process.env.__ARC_CONFIG__;
    delete process.env.__ARC_CONTEXT__;

    let isPromise = obj => obj && typeof obj.then === 'function';

    async function run () {
      /* Require first to populate the require cache for missing dependency warnings */
      let handler = require(handlerFile)[handlerMethod];

      /* Enumerate package files */
      let pkg = dir => exists(join(dir, 'package.json')) && JSON.parse(read(join(dir, 'package.json')));
      let lambdaPackage = pkg(cwd);
      let sharedPackage = shared && pkg(shared.src);
      let viewsPackage = views && pkg(views.src);

      let missing = [];
      let warn = {
        shared: name => missing.push('shared::' + name),
        views: name => missing.push('views::' + name),
        lambda: name => missing.push('lambda::' + name),
        root: name => missing.push('root::' + name),
      };
      let debug = [ { note: 'Execution metadata', cwd, lambdaPackage, shared, sharedPackage, views, viewsPackage } ];

      /* Iterate through the require cache looking for dependency issues */
      Object.keys(require.cache).forEach(mod => {
        let item = require.cache[mod];
        let loaded = item.loaded;
        let parent = item.parent;
        let isSubDep = parent?.id?.includes('node_modules');
        let name = item.filename.split('node_modules')[1];
        if (!name || !loaded || isSubDep) return;

        /* Dependency load location predicates */
        let loadedInsideShared = shared && parent?.filename?.startsWith(shared.src);
        let loadedInsideViews = views && parent?.filename?.startsWith(views.src);
        let loadedInsideLambda = item.filename.startsWith(cwd);
        let rootPath = join(projectSrc, 'node_modules', name);
        let loadedInsideRoot = require.cache?.[rootPath]?.loaded === true;

        /* Final dep name */
        name = name.substr(1).split(sep);
        name = name[0].startsWith('@') ? name.slice(0, 2).join('/') : name[0];

        debug.push({
          name,
          filename: item.filename,
          parent: item.parent.id,
          parentPath: item.parent.path,
          loadedInsideShared,
          loadedInsideViews,
          loadedInsideLambda,
          rootPath,
          loadedInsideRoot,
        });

        /**
         * Dependency warning time
         */
        /* Shared deps */
        let missingSharedDep = sharedPackage && (!sharedPackage.dependencies || !sharedPackage.dependencies[name]);
        if (loadedInsideShared && missingSharedDep) return warn.shared(name);

        let missingViewsDep = viewsPackage && (!viewsPackage.dependencies || !viewsPackage.dependencies[name]);
        if (loadedInsideViews && missingViewsDep) return warn.views(name);

        if (loadedInsideShared || loadedInsideViews) {
          if (lambdaPackage) {
            if (lambdaPackage?.dependencies?.[name]) return;
            else return warn.lambda(name);
          }
        }

        /* Lambda + root deps */
        else if (!loadedInsideLambda) {
          /* Lambda has a package.json and its dep was loaded from root */
          if (lambdaPackage) return warn.lambda(name);
          /* Lambda does NOT have a package.json and its dep was NOT loaded from root */
          else if (!loadedInsideRoot) return warn.root(name);
        }
      });
      if (missing.length) missing = [ ... new Set([ ...missing ]) ];

      let next = url('invocation/next');
      let invocation = await get({ url: next });
      let { headers, body: event } = invocation;

      let requestID = headers['Lambda-Runtime-Aws-Request-Id'] || headers['lambda-runtime-aws-request-id'];
      let deadlineMS = headers['Lambda-Runtime-Deadline-Ms'] || headers['lambda-runtime-deadline-ms'];
      let errorEndpoint = url('invocation/' + requestID + '/error');
      let responseEndpoint = url('invocation/' + requestID + '/response');
      let metaEndpoint = url('invocation/' + requestID + '/arc_meta');

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
          /* Publish meta first so the process isn't terminated immediately upon hitting the /response endpoint */
          let meta = { missing, debug, version: process.version };
          await post({ url: metaEndpoint, body: meta });
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
