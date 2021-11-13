const env = Deno.env.toObject();
const { sep } = JSON.parse(env.__ARC_DENO__);
const event = JSON.parse(env.__ARC_REQ__);
const context = JSON.parse(env.__ARC_CONTEXT__);
const root = env.LAMBDA_TASK_ROOT;
Deno.env.delete('__ARC_DENO__');
Deno.env.delete('__ARC_REQ__');
Deno.env.delete('__ARC_CONTEXT__');

/* look for index.{js,ts,tsx} and fallback to mod.{js,ts,tsx} */
const getPath = file => root + sep + file;
const paths = [
  getPath('index.js'),
  getPath('mod.js'),
  getPath('index.ts'),
  getPath('mod.ts'),
  getPath('index.tsx'),
  getPath('mod.tsx'),
];

let found = false;
let method = 'handler';
let handler;

async function getHandler () {
  for (let path of paths) {
    found = await exists(path);
    if (found) {
      let file = 'file://' + path;
      let mod = await import(file);
      handler = mod[method];
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

/* Helper to check for the entry file */
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
