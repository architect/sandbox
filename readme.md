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

Or if running Sandbox from within `@architect/architect`:

```
npx arc sandbox
```


### CLI options

- `-p`, `--port`, `port` - Manually specify HTTP port
  - Defaults to `3333`
- `-v`, `--verbose`, `verbose` - Enable verbose logging
- `--disable-symlinks` - Disable symlinking `src/shared` into all functions and
    use file copying instead


### Environment variables

- `ARC_API_TYPE` - Set the API Gateway API type
  - Can be one of `http` (aliased to `httpv2`), `httpv1`, `rest`
  - Defaults to `http`
- `ARC_QUIET` - If present, disable (most) logging
- `PORT` - Manually specify HTTP port
  - Defaults to `3333`
- `ARC_EVENTS_PORT`- Manually specify event bus port
  - Defaults to `3334`
- `ARC_TABLES_PORT`- Manually specify local DynamoDB port
  - Defaults to `3335`
- `ARC_LOCAL`- If present and used in conjunction with `NODE_ENV=staging|production`, emulates live `staging` or `production` environment
  - Uses your local `.arc-env` file's `@staging` or `@production` environment variables
  - Connects Sandbox to live AWS events and DynamoDB infra
  - Requires valid AWS credentials with the same profile name as defined in your project manifest

---

## API

Sandbox is designed to be integrated into your application's test suite. In most cases you'll only need to make use of `sandbox.start()` and `sandbox.end()`. However, individual Sandbox services can also be individually started and stopped. ([See below](#individual-sandbox-services).)

All methods must be passed an options object that may containing the following parameters:
- `port` - **String** - Manually specify HTTP port
  - Defaults to `3333`
- `quiet` - **Boolean** - Disables (most) logging

---

### Sandbox

> Start and shut down the Sandbox; unless you have specific per-service needs, we generally advise most folks use this interface for testing


### `sandbox.start(options[, callback]) → [Promise]`

Starts the Sandbox; first checks that ports are available to consume, prints a banner, loads Architect and userland environment variables, hydrates application dependencies, and starts various Sandbox services (including `@events`, `@queues`, `@tables`, `@indexes`, `@http`, `@static` and `@ws`).

Invokes `callback` once everything is ready, or returns a `promise` if `callback` is falsy.


### `sandbox.end([callback]) → [Promise]`

Shuts down anything started by `sandbox.start()`. Invokes `callback` once shut down, or returns a `promise` if `callback` is falsy.

---

### Individual Sandbox services

> Useful for starting a subset of Sandbox's service functionality in your tests, either for increased isolation, or to enhance throughput


### Events (`@events`, `@queues`)

### `sandbox.events.start(options[, callback]) → [Promise]`

Starts up a local event bus, enabling interprocess communication for [`@queues`][queues] and [`@events`][events] functions (if defined in your Architect project manifest).

Invokes `callback` once everything is ready, or returns a `promise` if `callback` is falsy.


### `sandbox.events.end([callback]) → [Promise]`

Shuts down anything started by `sandbox.events.start()`. Invokes `callback` once shut down, or returns a `promise` if `callback` is falsy.

---

### HTTP (`@http`, `@static`, `@ws`)

### `sandbox.http.start(options[, callback]) → [Promise]`

Starts up a local HTTP and WebSocket servers, enabling [`@http`][http] or [`@websocket`][websocket] functions (if defined in your Architect project manifest).

Invokes `callback` once everything is ready, or returns a `promise` if `callback` is falsy.


### `sandbox.http.end([callback]) → [Promise]`

Shuts down anything started by `sandbox.http.start()`. Invokes `callback` once shut down, or returns a `promise` if `callback` is falsy.

---

### Tables (`@tables`, `@indexes`)

### `sandbox.tables.start(options[, callback]) → [Promise]`

Starts up a [local in-memory DynamoDB server](https://www.npmjs.com/package/dynalite), enabling [`@tables`][tables] or [`@indexes`][indexes] functions (if defined in your Architect project manifest).

Invokes `callback` once everything is ready, or returns a `promise` if `callback` is falsy.


### `sandbox.tables.end([callback]) → [Promise]`

Shuts down anything started by `sandbox.tables.start()`. Invokes `callback` once shut down, or returns a `promise` if `callback` is falsy.

---

## Example

### Tape

```javascript
let sandbox = require('@architect/sandbox')
let test = require('tape)

test('Start the Sandbox', async t => {
  t.plan(1)
  let result = await sandbox.start()
  t.equal(result, 'Sandbox successfully started')
})

test('Tests go here', t => {
  // Make use of various Sandbox resources in your tests...
})

test('Shut down the Sandbox', async t => {
  t.plan(1)
  let result = await sandbox.end()
  t.equal(result, 'Sandbox successfully shut down')
})
```


### Jest

```javascript
let sandbox = require('@architect/sandbox')

beforeAll(async () => {
  let result = await sandbox.start()
  expect(result).toBe('Sandbox successfully started')
})

afterAll(async () => {
  let result = await sandbox.end()
  expect(result).toBe('Sandbox successfully shut down')
})

test('Tests go here', () => {
  // Make use of various Sandbox resources in your tests...
})
```

## Development

### Requirements

The tests in this repository require that you have the `deno` runtime installed
on your local machine. Install `deno` by visiting
https://deno.land/#installation.

### Running Tests

To work on sandbox, first make sure you have installed the dependencies:

    npm install

To run all tests, including the linter:

    npm test

To run just the linter:

    npm run lint

To run just the unit tests (which are located under `test/unit`):

    npm run test:unit

To get a code coverage report based on unit test execution:

    npm run coverage

To run just the integration tests (which are located under `test/integration'):

    npm run test:integration


[events]: https://arc.codes/reference/arc/events
[http]: https://arc.codes/reference/arc/http
[queues]: https://arc.codes/reference/arc/queues
[tables]: https://arc.codes/reference/arc/tables
[ws]: https://arc.codes/reference/arc/ws
