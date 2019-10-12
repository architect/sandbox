let fn = require('./index').handler;
let event = JSON.parse(process.env.__ARC_REQ__);
let context = JSON.parse(process.env.__ARC_CONTEXT__);

function callback(err, result) {
  let payload = err? {name:err.name, message:err.message, stack:err.stack} : result;
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
