import { handler } from './index.ts';

const env = Deno.env();
const event = JSON.parse(env.__ARC_REQ__);
const context = JSON.parse(env.__ARC_CONTEXT__);


function callback(err, result) {
  let payload = err? {name:err.name, message:err.message, stack:err.stack} : result;
  console.log('__ARC__', JSON.stringify(payload), '__ARC_END__');
}

if (handler.constructor.name === 'AsyncFunction') {
  handler(event, context, callback).then(function win(result) {
    callback(null, result);
  }).catch(callback);
}
else {
  handler(event, context, callback);
}
