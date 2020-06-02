const env = Deno.env.toObject();
const event = JSON.parse(env.__ARC_REQ__);
const context = JSON.parse(env.__ARC_CONTEXT__);
const path = `${env.LAMBDA_TASK_ROOT}/index.ts`;

let { handler } = await import(path);

function callback(err, result) {
  if (err) console.log(err);
  let payload = err
    ? { name: err.name, message: err.message, stack: err.stack }
    : result;
  console.log('__ARC__', JSON.stringify(payload), '__ARC_END__');
  Deno.exit(err? 1 : 0)
}

if (handler.constructor.name === 'AsyncFunction') {
  handler(event, context, callback).then(function win(result) {
    callback(null, result);
  }).catch(callback);
}
else {
  handler(event, context, callback);
}
