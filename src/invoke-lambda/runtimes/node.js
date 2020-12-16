let {
  projectSrc,
  handlerFile,
  handlerFunction,
} = JSON.parse(process.env.__ARC_CONFIG__);
let context = JSON.parse(process.env.__ARC_CONTEXT__);
let { join, sep } = require('path');
let { existsSync } = require('fs');
let handler = './' + handlerFile;
let fn = require(handler)[handlerFunction];
let cwd = process.cwd();

let event = '';
process.stdin.on('data', chunk => event += chunk);
process.stdin.on('close', () => {
  event = JSON.parse(event);

  let lambdaHasPackage = existsSync(join(cwd, 'package.json'));
  let missing = [];
  Object.keys(require.cache).forEach(mod => {
    let item = require.cache[mod];
    let loaded = item.loaded;
    let isSubDep = item.parent && item.parent.id && item.parent.id.includes('node_modules');
    let name = item.filename.split('node_modules')[1];
    if (!name || !loaded || isSubDep) return;

    let loadedInsideLambda = item.filename.startsWith(cwd);
    let rootPath = join(projectSrc, 'node_modules', name);
    let loadedAtRoot = require.cache[rootPath] && require.cache[rootPath].loaded === true;
    name = name.substr(1).split(sep);
    name = name[0].startsWith('@') ? name.slice(0,2).join('/') : name[0];

    /* Dependency warnings */
    if (!loadedInsideLambda) {
      /* Lambda has a package.json and its dep was loaded from root */
      if (lambdaHasPackage)   return missing.push('lambda::' + name);
      /* Lambda does NOT have a package.json and its dep was NOT loaded from root */
      else if (!loadedAtRoot) return missing.push('root::' + name);
    }
  });
  if (missing.length) missing = [... new Set([...missing])];

  function callback(err, result) {
    if (err) console.log(err);
    let payload = err
      ? { name: err.name, message: err.message, stack: err.stack }
      : result;
    if (payload) payload.__DEP_ISSUES__ = missing;
    console.log('__ARC__', JSON.stringify(payload), '__ARC_END__');
  }

  if (fn.constructor.name === 'AsyncFunction') {
    fn(event, context, callback).then(function win(result) {
      callback(null, result);
    }).catch(callback);
  }
  else {
    fn(event, context, callback);
  }
})
