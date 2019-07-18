# `@architect/sandbox` [![Travis Build Status](https://travis-ci.com/architect/sandbox.svg?branch=master)](https://travis-ci.com/architect/sandbox) [![Appveyor Build Status](https://ci.appveyor.com/api/projects/status/1j42wah7k1ls7xfp/branch/master?svg=true)](https://ci.appveyor.com/project/ArchitectCI/sandbox/branch/master) [![codecov](https://codecov.io/gh/architect/sandbox/branch/master/graph/badge.svg)](https://codecov.io/gh/architect/sandbox)

Run an @architect project in a local sandbox.

## Install

    npm i @architect/sandbox

## API

### `sandbox.cli({ver}, callback)`

Will use specified `ver` or use the version string defined in this project's
`package.json`.

Invokes [`sandbox.start()`][start] to start a sandbox instance, passing the parameter
object in. Then sets up a filesystem watcher for changes to:

1. any files within the `shared/` folder, in which case it will
   re-[hydrate][hydrate] all functions with the new files, and
2. the `.arc` file, in which case it will re-start the HTTP server by calling
   into [`http()`][http].

### `sandbox.db.start(callback)`

Starts a singleton in-memory dynalite dynamodb server, automatically creating any
tables or indexes defined by the `.arc` file. Also creates a local session table.

Returns an object with a `close()` method that shuts the server down.

Invokes `callback` once the db is up and listening.

### `sandbox.events.start(callback)`

If the `.arc` file defines [queues][queues] or [events][events], sets up
interprocess communication between your events and queues via a tiny web server.

Returns an object with a `close()` method that shuts the server down.

Invokes `callback` once the servers are listening.

### `sandbox.http.start(callback)`

If the `.arc` file defines http or websocket routes, starts the necessary
servers and sets up routes as defined in the `.arc` file.

Invokes `callback` once the servers are listening.

### `sandbox.http.close()`

Closes any servers started via [`sandbox.http.start()`][start].

### `sandbox.start({port, options}, callback)`

Checks that ports are available to consume, prints a banner, and sets up any
local DBs via [`sandbox.db.start()`][db], events or queues via
[`sandbox.events.start()`][events-start], HTTP handlers via
[`sandbox.http.start()`][http-start].

Invokes `callback` once everything is ready, passing `null` as the first
parameter and `end` as the second parameter to `callback`, where `end` is a
function that closes all servers down.

Returns a promise if `callback` is falsy.

## Example Usage

```javascript
let sandbox = require('@architect/sandbox')
```

[npm]: https://www.npmjs.com/package/@architect/sandbox
[cli]: #sandboxcliver-callback
[db]: #sandboxdbstartcallback
[events-start]: #sandboxeventsstart
[http-start]: #sandboxhttpstartcallback
[http-close]: #sandboxhttpclosecallback
[start]: #sandboxstartport-options-callback
[hydrate]: https://www.npmjs.com/package/@architect/hydrate
[events]: https://arc.codes/reference/events
[queues]: https://arc.codes/reference/queues
