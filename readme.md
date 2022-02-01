[<img src="https://assets.arc.codes/architect-logo-500b@2x.png" width=500>](https://www.npmjs.com/package/@architect/sandbox)

## [`@architect/sandbox`](https://www.npmjs.com/package/@architect/sandbox)

> Architect local development environment: run full Architect projects locally & offline in an in-memory sandbox

[![GitHub CI status](https://github.com/architect/sandbox/workflows/Node%20CI/badge.svg)](https://github.com/architect/sandbox/actions?query=workflow%3A%22Node+CI%22)

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
- `-d`, `--debug`, `debug` - Enable debose logging
- `-q`, `--quiet`, `quiet` - Disable (most) logging
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
  - Defaults to `5000`
- `ARC_LOCAL`- If present and used in conjunction with `NODE_ENV=staging|production`, emulates live `staging` or `production` environment
  - Uses your local preference file's `@staging` or `@production` environment variables
  - Connects Sandbox to live AWS events and DynamoDB infra
  - Requires valid AWS credentials with the same profile name as defined in your project manifest

---

## API

Sandbox is designed to be integrated into your application's test suite. In most cases you'll only need to make use of `sandbox.start()` and `sandbox.end()`. However, individual Sandbox services can also be individually started and stopped. ([See below](#individual-sandbox-services).)

Methods may be passed an options object containing the following parameters:
- `apigateway` - **String** - Specify the API Gateway API type
  - Defaults to `http`
  - Can be one of `http` (aliased to `httpv2`), `httpv1`, `rest`
- `cwd` - **String** - Specify a working directory (handy for aiming Sandbox at test mocks)
- `env` - **Object** - Environment variables for Lambda invocations in automated testing
  - String values overwrite env vars of the same name set via `.env` or `prefs.arc` files
  - `undefined` values delete any env vars of the same name set via `.env` or `prefs.arc` files
- `port` - **String or Number** - Specify HTTP port
  - Defaults to `3333`
- `quiet` - **Boolean** - Disables (most) logging
- `runStartupCommands` - **Boolean** - Disable `@sandbox-startup` commands
  - Defaults to `true`
- `runtimeCheck` - **String** - Check for runtime version mismatches
  - If set to `warn` Sandbox will warn of mismatches in stdout
  - If set to `error` (suggested for test environments) Sandbox will fail to start up
  - Does not run by default
- `symlink` - **Boolean** - Use symlinking to Architect shared code from within each Lambda's dependencies (e.g. `src/http/get-index/node_modules/@architect/shared` → `src/shared`)
  - Defaults to `true`
  - `false` copies shared code into each Lambda, which can result much slower startup and dependency rehydration speeds
- `watcher` - **Boolean** - Disable the Sandbox file watcher (and related Sandbox file watcher plugin API)
  - Defaults to `true`

---

### Sandbox

> Start and shut down the Sandbox; unless you have specific per-service needs, we generally advise most folks use this interface for testing


### `sandbox.start(options[, callback]) → [Promise]`

Starts the Sandbox; first checks that ports are available to consume, prints a banner, loads Architect and userland environment variables, hydrates application dependencies, and starts various Sandbox services (including `@events`, `@queues`, `@tables`, `@indexes`, `@http`, `@static` and `@ws`).

Invokes `callback` once everything is ready, or returns a `promise` if `callback` is falsy.


### `sandbox.end([callback]) → [Promise]`

Shuts down anything started by `sandbox.start()`. Invokes `callback` once shut down, or returns a `promise` if `callback` is falsy.

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

To make tests run extra noisy-like, add the `NOISY_TESTS=true` env var


[events]: https://arc.codes/reference/arc/events
[http]: https://arc.codes/reference/arc/http
[queues]: https://arc.codes/reference/arc/queues
[tables]: https://arc.codes/reference/arc/tables
[ws]: https://arc.codes/reference/arc/ws
