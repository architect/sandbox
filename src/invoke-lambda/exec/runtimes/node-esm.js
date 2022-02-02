/* eslint semi: [ 'error', 'always' ] */
let { __ARC_CONFIG__, __ARC_CONTEXT__ } = process.env;
let { handlerFile, handlerMethod } = JSON.parse(__ARC_CONFIG__);
let context = JSON.parse(__ARC_CONTEXT__);
delete process.env.__ARC_CONFIG__;
delete process.env.__ARC_CONTEXT__;

let file = 'file://' + handlerFile;
let mod = await import(file);
let handler = mod[handlerMethod];

function isPromise (obj) {
  return obj && typeof obj.then === 'function';
}

let event = '';
process.stdin.on('data', chunk => event += chunk);
process.stdin.on('close', () => {
  event = JSON.parse(event);

  function callback (err, result) {
    if (err) console.log(err);
    let payload = err
      ? { name: err.name, message: err.message, stack: err.stack }
      : result;
    /* Always output __ARC_META__ first */
    console.log('__ARC_META__', JSON.stringify({}), '__ARC_META_END__');
    console.log('__ARC__', JSON.stringify(payload), '__ARC_END__');
  }

  try {
    const response = handler(event, context, callback);
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
