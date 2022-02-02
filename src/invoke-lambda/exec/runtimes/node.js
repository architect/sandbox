/* eslint semi: [ 'error', 'always' ] */
let { __ARC_CONFIG__, __ARC_CONTEXT__ } = process.env;
let { projectSrc, handlerFile, handlerMethod, shared, views } = JSON.parse(__ARC_CONFIG__);
let context = JSON.parse(__ARC_CONTEXT__);
let { join, sep } = require('path');
let { existsSync: exists, readFileSync: read } = require('fs');
let fn = require(handlerFile)[handlerMethod];
let cwd = process.cwd();
delete process.env.__ARC_CONFIG__;
delete process.env.__ARC_CONTEXT__;

function isPromise (obj) {
  return obj && typeof obj.then === 'function';
}

let event = '';
process.stdin.on('data', chunk => event += chunk);
process.stdin.on('close', () => {
  event = JSON.parse(event);

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

  function callback (err, result) {
    if (err) console.log(err);
    let payload = err
      ? { name: err.name, message: err.message, stack: err.stack }
      : result;
    let meta = { missing, debug, version: process.version };
    /* Always output __ARC_META__ first */
    console.log('__ARC_META__', JSON.stringify(meta), '__ARC_META_END__');
    console.log('__ARC__', JSON.stringify(payload), '__ARC_END__');
  }

  try {
    const response = fn(event, context, callback);
    if (isPromise(response)) {
      response.then(function win (result) {
        callback(null, result);
      }).catch(callback);
    }
  }
  catch (err) {
    callback(err);
  }
});
