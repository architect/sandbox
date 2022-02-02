const env = Deno.env.toObject();
const event = JSON.parse(env.__ARC_REQ__);
const config = JSON.parse(env.__ARC_CONFIG__);
const context = JSON.parse(env.__ARC_CONTEXT__);
Deno.env.delete('__ARC_REQ__');
Deno.env.delete('__ARC_CONFIG__');
Deno.env.delete('__ARC_CONTEXT__');

const { handlerFile, handlerMethod } = config;
const file = 'file://' + handlerFile;
const mod = await import(file);
const handler = mod[handlerMethod];

function callback (err, result) {
  if (err) console.log(err);
  let payload = err
    ? { name: err.name, message: err.message, stack: err.stack }
    : result;
  let meta = { /* Add execution metadata here */ };
  /* Always output __ARC_META__ first */
  console.log('__ARC_META__', JSON.stringify(meta), '__ARC_META_END__');
  console.log('__ARC__', JSON.stringify(payload), '__ARC_END__');
  Deno.exit(err? 1 : 0);
}

if (handler.constructor.name === 'AsyncFunction') {
  handler(event, context, callback)
    .then(result => callback(null, result))
    .catch(callback)
}
else {
  handler(event, context, callback);
}
