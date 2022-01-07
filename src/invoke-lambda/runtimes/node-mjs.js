/* eslint-enable semi */
/* eslint semi: [ 'error', 'always' ] */
let { __ARC_CONFIG__, __ARC_CONTEXT__ } = process.env;
let { projectSrc, handlerFile, handlerFunction, shared, views } = JSON.parse(__ARC_CONFIG__);
let context = JSON.parse(__ARC_CONTEXT__);
import { join } from 'path';
import { existsSync as exists, readFileSync as read } from 'fs';
let cwd = process.cwd();
delete process.env.__ARC_CONFIG__;
delete process.env.__ARC_CONTEXT__;

/* This is a hack and should live in Inventory; look for index.{js,mjs} */
const paths = [
  join(cwd, 'index.js'),
  join(cwd, 'index.mjs'),
];

let found = false;
let handler;

async function getHandler () {
  for (let path of paths) {
    found = await exists(path);
    if (found) {
      let mod = await import('file://' + path);
      handler = mod[handlerFunction];
      if (typeof handler !== 'function') {
        found = false;
      }
      else {
        break;
      }
    }
  }
}
await getHandler();

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
