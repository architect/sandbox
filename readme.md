[<img src="https://s3-us-west-2.amazonaws.com/arc.codes/architect-logo-500b@2x.png" width=500>](https://www.npmjs.com/package/@architect/sandbox)

## [`@architect/sandbox`](https://www.npmjs.com/package/@architect/sandbox)

> Architect local development environment: run full Architect projects locally & offline in an in-memory sandbox

[![GitHub CI status](https://github.com/architect/sandbox/workflows/Node%20CI/badge.svg)](https://github.com/architect/sandbox/actions?query=workflow%3A%22Node+CI%22)
<!-- [![codecov](https://codecov.io/gh/architect/sandbox/branch/master/graph/badge.svg)](https://codecov.io/gh/architect/sandbox) -->

## Install

```
npm i @architect/sandbox
```

---

## CLI

### Start the sandbox

```
npx sandbox
```

Or if running from within @architect/architect:

```
npx arc sandbox
```


### CLI options

- `-p`, `--port`, `port` - Manually specify HTTP port
- `-v`, `--verbose`, `verbose` - Enable verbose logging mode


### Environment variables

- `ARC_API_TYPE` - Sets the API Gateway API type
  - Can be one of `http` (aliased to `httpv2`), `httpv1`, `rest`
  - Defaults to `http`
- `ARC_QUIET` - If present, disables (most) logging
- `PORT` - Manually specify HTTP port
  - Defaults to `3333`
- `ARC_EVENTS_PORT`- Manually specify event bus port
  - Defaults to `3334`
- `ARC_TABLES_PORT`- Manually specify local DynamoDB port
  - Defaults to `3335`
- `ARC_LOCAL`- When used in conjunction with `NODE_ENV=staging|production`, Sandbox will use your `.arc-env` files staging or production environment variables, and connect to live AWS events and DynamoDB infra (with valid AWS credentials)

---

## API

Sandbox is designed to be integrated into your application's test suite. In most cases you'll only need `sandbox.start()` and `sandbox.end()`. However, individual Sandbox services can also be individually started and stopped.

All methods must be passed an options object that may containing the following parameters:
- `port` - **String** - Manually specify HTTP port
  - Defaults to `3333`
- `quiet` - **Boolean** - Disables (most) logging

### Sandbox

### `sandbox.start(options[, callback]) → [Promise]`

Starts the Sandbox; first checks that ports are available to consume, prints a banner, loads Architect and userland environment variables, hydrates application dependencies, and starts various Sandbox services (including `events`, `tables` and `http`).

Invokes `callback` once everything is ready, or returns a `promise` if `callback` is falsy.


### `sandbox.end([callback]) → [Promise]`

Shuts down anything started by `sandbox.start()`. Invokes `callback` once shut down, or returns a `promise` if `callback` is falsy.


### Individual Sandbox services

### Events (`@events`, `@queues`)

### `sandbox.events.start(options[, callback]) → [Promise]`

Starts up a local event bus, enabling interprocess communication for [`@queues`][queues] and [`@events`][events] functions (if defined in your Architect project manifest).

Invokes `callback` once everything is ready, or returns a `promise` if `callback` is falsy.


### `sandbox.events.end([callback]) → [Promise]`

Shuts down anything started by `sandbox.events.start()`. Invokes `callback` once shut down, or returns a `promise` if `callback` is falsy.


### HTTP (`@http`, `@static`, `@ws`)

### `sandbox.http.start(options[, callback]) → [Promise]`

Starts up a local HTTP and WebSocket servers, enabling [`@http`][http] or [`@websocket`][websocket] functions (if defined in your Architect project manifest).

Invokes `callback` once everything is ready, or returns a `promise` if `callback` is falsy.


### `sandbox.http.end([callback]) → [Promise]`

Shuts down anything started by `sandbox.http.start()`. Invokes `callback` once shut down, or returns a `promise` if `callback` is falsy.


### Tables (`@tables`, `@indexes`)

### `sandbox.tables.start(options[, callback]) → [Promise]`

Starts up a [local in-memory DynamoDB server](https://www.npmjs.com/package/dynalite), enabling [`@tables`][tables] or [`@indexes`][indexes] functions (if defined in your Architect project manifest).

Invokes `callback` once everything is ready, or returns a `promise` if `callback` is falsy.


### `sandbox.tables.end([callback]) → [Promise]`

Shuts down anything started by `sandbox.tables.start()`. Invokes `callback` once shut down, or returns a `promise` if `callback` is falsy.

---

## Example

```javascript
let sandbox = require('@architect/sandbox');

(async function () {
  await sandbox.start()
  // Use various Sandbox resources
  await sandbox.end()
})()
```

[events]: https://arc.codes/reference/arc/events
[http]: https://arc.codes/reference/arc/http
[queues]: https://arc.codes/reference/arc/queues
[tables]: https://arc.codes/reference/arc/tables
[ws]: https://arc.codes/reference/arc/ws
