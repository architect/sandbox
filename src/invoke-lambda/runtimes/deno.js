const env = Deno.env.toObject();
const event = JSON.parse(env.__ARC_REQ__);
const context = JSON.parse(env.__ARC_CONTEXT__);
const sep = Deno.build.os === 'windows' ? '\\' : '/';

/* look for index.{js,ts,tsx} and fallback to mod.{js,ts,tsx} */
const paths = [
  `${env.LAMBDA_TASK_ROOT}${sep}index.js`,
  `${env.LAMBDA_TASK_ROOT}${sep}mod.js`,
  `${env.LAMBDA_TASK_ROOT}${sep}index.ts`,
  `${env.LAMBDA_TASK_ROOT}${sep}mod.ts`,
  `${env.LAMBDA_TASK_ROOT}${sep}index.tsx`,
  `${env.LAMBDA_TASK_ROOT}${sep}mod.tsx`,
];

let found = false;
let method = 'handler';
let handler;

for (let path of paths) {
  found = await exists(path);
  if (found) {
    let mod = await import(path);
    handler = mod[method];
    if (typeof handler != "function") {
      found = false;
    }
    else {
      break;
    }
  }
}

function callback(err, result) {
  if (err) console.log(err);
  let payload = err
    ? { name: err.name, message: err.message, stack: err.stack }
    : result;
  console.log('__ARC__', JSON.stringify(payload), '__ARC_END__');
  Deno.exit(err? 1 : 0);
}

if (handler.constructor.name === 'AsyncFunction') {
  handler(event, context, callback).then(function win(result) {
    callback(null, result);
  }).catch(callback);
}
else {
  handler(event, context, callback);
}

/** helper to check for the entry file */
async function exists(filename) {
  try {
    await Deno.stat(filename);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return false;
    }
    else {
      throw error;
    }
  }
}
