let fn = require('./index').handler;
let context = JSON.parse(process.env.__ARC_CONTEXT__);

let event = '';
process.stdin.on('data', chunk => event += chunk);
process.stdin.on('close', () => {
  event = JSON.parse(event);

  let cwd = process.cwd();
  let missing = [];
  Object.keys(require.cache).forEach(mod => {
    let item = require.cache[mod];

    let loaded = item.loaded;
    let notSubDep = item.parent && item.parent.id && !item.parent.id.includes('node_modules');

    if (!item.filename.startsWith(cwd) && notSubDep && loaded) {
      let name = item.filename.split('node_modules')[1];
      if (!name) return;
      name = name.substr(1).split('/');
      name = name[0].startsWith('@') ? name.slice(0,2).join('/') : name[0];
      missing.push(name);
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
