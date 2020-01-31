[<img src="https://s3-us-west-2.amazonaws.com/arc.codes/architect-logo-500b@2x.png" width=500>](https://www.npmjs.com/package/@architect/sandbox)

## [`@architect/sandbox`](https://www.npmjs.com/package/@architect/sandbox)

> Architect dev server: run full Architect projects locally & offline in a sandbox

[![GitHub CI status](https://github.com/architect/sandbox/workflows/Node%20CI/badge.svg)](https://github.com/architect/sandbox/actions?query=workflow%3A%22Node+CI%22)
<!-- [![codecov](https://codecov.io/gh/architect/sandbox/branch/master/graph/badge.svg)](https://codecov.io/gh/architect/sandbox) -->

## Install

```
npm i @architect/sandbox
```

## Run locally

```
npx sandbox
```


## API

### `sandbox.cli({ver}, callback)`

Invokes [`sandbox.start()`][start] to start a sandbox instance, passing the parameter object in. Then sets up a filesystem watcher for changes to:

1. Files within shared folders (`src/shared/, src/views/`, etc.), in which case it will re-[hydrate][hydrate] all functions with the new files, and
2. The Architect project manifest file, in which case it will re-start the HTTP server by calling into [`http()`][http].

Prints the specified `ver` on init, or falls back to the version string defined in this project's `package.json`.


### `sandbox.db.start(callback)`

Starts a singleton [local in-memory DynamoDB server](https://www.npmjs.com/package/dynalite), automatically creating any tables or indexes defined in the project manifest's [`@tables`][tables] pragma. Also creates a local session table.

Returns an object with a `close([callback])` method that gracefully shuts the server down.

Invokes `callback` once the DB is up and listening.


### `sandbox.events.start(callback)`

If Architect project manifest defines [`@queues`][queues] or [`@events`][events], sets up interprocess communication between your events and queues via a tiny web server.

Returns an object with a `close([callback])` method that gracefully shuts the server down.

Invokes `callback` once the server is up and listening.


### `sandbox.http.start(callback)`

If Architect project manifest defines defines [`@http`][http] or [`@websocket`][websocket] routes, starts the necessary servers and sets up routes as defined in the project manifest.

Invokes `callback` once the server is up and listening.


### `sandbox.http.close([callback])`

Closes any servers started via [`sandbox.http.start()`][start].


### `sandbox.start({port, options, quiet}, callback)`

Initializes the sandbox; first checks that ports are available to consume, prints a banner, loading basic environment variables and necessary AWS credentials, and sets up any local DBs via [`sandbox.db.start()`][db], events or queues via [`sandbox.events.start()`][events-start], HTTP handlers via [`sandbox.http.start()`][http-start].

Invokes `callback` once everything is ready, passing `null` as the first parameter and `sandbox.end` as the second parameter.

Return a `promise` if `callback` is falsy.


### `sandbox.end([callback])`

Shuts down the sandbox, closing down all running servers and services. Returns a `promise` if `callback` is falsy.

---

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
[http]: https://arc.codes/reference/http
[queues]: https://arc.codes/reference/queues
[tables]: https://arc.codes/reference/tables
[ws]: https://arc.codes/reference/ws
