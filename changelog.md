# Architect Sandbox changelog

---

## [5.2.5] 2022-05-09

### Changed

- Updated dependencies; `lambda-runtimes` enables `nodejs16.x`

---

## [5.2.4] 2022-04-28

### Changed

- Updated dependencies

### Fixed

- Sandbox servers will now only listen to the loopback interface and will not
  listen for inbound connections from the network; thanks @lpsinger!

---

## [5.2.3] 2022-04-19

### Fixed

- Fail loudly when AWS-SDK finds a credentials file without default profile; thanks @stuartlangridge!
- Fixed Sandbox possibly hanging when it fails to start up in tests

---

## [5.2.1 - 5.2.2] 2022-03-31

### Changed

- Updated dependencies

---

## [5.2.0] 2022-03-09

### Added

- Added support for seed data via `sandbox-seed.js[on]` (or custom) file

---

## [5.1.2] 2022-03-04

### Fixed

- Added `arc` property to plugin API calls, which should have been there
- Froze `inventory` property in plugin API calls

---

## [5.1.1] 2022-03-02

### Fixed

- Fixed sandbox not detecting Lambda function return when process does not exit automatically; fixes #1319, thanks @mawdesley!

---

## [5.1.0] 2022-02-28

### Added

- Added SSM `ssm.getParameter()` support (in addition to `ssm.getParametersByPath()`)
- Hardened Sandbox SSM emulation to have tighter query behavior, output valid errors, etc.


### Fixed

- Fixed Sandbox responding to all SSM requests indiscriminately
  - Sandbox now only fulfills requests for the app that it's running (or for `@architect/functions` running as a bare module)

---

## [5.0.3] 2022-02-24

### Added

- Enable `@architect/functions` to retrieve port configuration when run as a bare module and not within a Lambda
- Run startup commands via `@sandbox-start` preferences pragma
  - This is a bit closer to `plugins.sandbox.start` than the existing `@sandbox-startup` preferences pragma


### Fixed

- Fix missing `ARC_SANDBOX` env var `version` property in `sandbox.start` plugins + `@sandbox-startup` scripts

---

## [5.0.2] 2022-02-22

### Fixed

- Fixed live reload behavior in Firefox where Firefox would reload the wrong path, preventing links from being accessed

---

## [5.0.0] 2022-01-12

### Added

- Architect 10 plugin API support! Specifically:
  - Added Sandbox watcher API
  - Added custom runtime support
  - Added env setter plugin support
- Added live reload support!
  - Add `@sandbox livereload true` to your preferences to enable
  - Your browser will automatically refresh any time a `get` or `any` HTTP handler changes, or when any file in `src/shared`, `src/views`, or `public` changes
- Added ability to disable Sandbox watcher with `watcher` (boolean) in API option
- Added port configuration via `prefs.arc`
  - The precedence order is now `prefs.arc` > `port` API option or `--port` CLI flag > environment variables
  - Also added `ARC_HTTP_PORT` env var for configuring the HTTP port (in addition to `PORT`)
- Added automatic port selection for internal service port configuration
  - (Probably) never again will your multiple simultaneous Sandbox instances conflict with each other!
  - HTTP port selection still defaults to `3333` and will halt Sandbox from starting if it conflicts (since it's presumably what you're expecting to see in your browser)
  - Any manually specified port conflicts will also halt Sandbox from starting
- Added Architect + userland env vars to startup scripts


### Changed

- Breaking change: Architect no longer relies on or makes use of the `NODE_ENV` or `ARC_CLOUDFORMATION` env vars
  - Older versions of Node.js Architect libraries such as `@architect/functions` made use of these env vars, so it is wise to upgrade them at this time
  - Also be sure to consult the Architect [upgrade guide](https://arc.codes/docs/en/about/upgrade-guide)
- Breaking change: passing env vars in with the module's `env` option no longer merges those env vars with any found in `.env` or `prefs.arc`
  - The new env var precedence is `env` option > `.env` > `prefs.arc`
- Breaking change: removed support for legacy `.arc-env` env files
  - Architect deprecated writing to `.arc-env` in late 2020; Sandbox will no longer read and use it for local environment variables
  - If you are still using a `.arc-env` file, please consider `prefs.arc` or `.env` for your local env vars
- Breaking change: removed `ARC_SANDBOX_ENABLE_CORS` env var option
  - Architect has supported `options` requests since version 8; that is the preferred approach to handling CORS
- Breaking change: bare CLI arguments related to logging (e.g. `sandbox quiet`) as aliases to flags are now discarded, please use CLI flags (e.g. `sandbox --quiet`, or `sandbox --debug`)
- Breaking change: deprecate `ARC_SANDBOX_PATH_TO_STATIC` in favor of `ARC_STATIC_BUCKET` for use with `@architect/asap`
- Internal change: switched to `chokidar` from `node-watch` for file watching
- Internal change: made Inventory responsible for handling `.env` env vars
- Internal change: made Inventory responsible for figuring out `nodejs14.x` handler module systems and file names
- Internal change: stopped populating default `arc-sessions` + `data` tables; this was a quirky holdover behavior from early Architect that differed Sandbox from live AWS behavior
- Prefer `ARC_SESSION_TABLE_NAME` to `SESSION_TABLE_NAME` env var for Architect's built-in sessions management
  - All non-namespaced names will continue to be supported until at least Architect 11; we suggest changing them over to the namespaced equivalents as soon as is convenient
- Watcher now restarts Sandbox on preference file changes to ensure port changes and env vars are repopulated

---

## [4.5.2] 2022-01-11

### Fixed

- Fixed bug where multi-tenant Lambdas would error on startup

---

## [4.5.0 - 4.5.1] 2022-01-06

### Added

- Added support for Node.js 14 ESM in Lambda!


### Fixed

- Properly invoke Ruby with required keyword params; partial fix for #1291

---

## [4.4.2] 2021-12-01

### Added

- Added `lambdaSrc` propery (mapped from `lambda.src`) to `ARC_SANDBOX` context env var

---

## [4.4.1] 2021-11-22

### Changed

- Updated dependencies


### Fixed

- Fixed HTTP route sorting; however you've organized your `@http` pragma, Sandbox should now behave much more like API Gateway; fixes #977

---

## [4.4.0] 2021-11-16

### Added

- Added support for `@tables-indexes` (which will eventually supersede `@indexes`)
  - For more see: https://arc.codes/tables-indexes


### Changed

- Updated dependencies

---

## [4.3.1] 2021-11-13

### Added

- Added internal `ARC_SANDBOX` env var for Sandbox metadata in Lambda invocations


### Fixed

- Fixed upcasing all userland environment variables
- Removed extraneous internal `__ARC*` environment variables from Lambda invocation

---

## [4.3.0] 2021-11-03

### Added

- Sandbox now immediately streams Lambda logs to the console instead of printing everything all at once upon completion of execution; thanks @andybee!
- Added runtime mismatch warnings
  - Example: Sandbox will warn if your `get /foo` Lambda is configured for Python 3.9 and your local machine uses Python 3.8
- Added `runStartupCommands` setting to API options
  - Defaults to `true`; setting `false` disables `prefs.arc @sandbox-startup` commands, which may be useful for local testing; thanks @reconbot!
- Added `env` option to API allowing programmatic control (add, replace, delete) of Lambda environment variables during automated testing, thanks @actsone8!
- Added internal Arc service mock for API Gateway Management API mock for managing WebSocket connections via `aws-sdk` calls; big thanks to @reconbot!


### Changed

- Sandbox will only ever print a given dependency issue one time, instead of upon each invocation
- Removed support for bare `port` CLI flag (e.g. `arc sandbox port 12345`); Sandbox now requires either `-p` or `--port` for setting the port from the CLI

---

## [4.2.3] 2021-11-02

### Changed

- Added warnings for macOS Monterey port conflicts on 5000 and 7000

---

## [4.2.2] 2021-10-20

### Changed

- Updated dependencies

---

## [4.2.🍁 - 4.2.1] 2021-10-05

### Added

- Added Lambda context object with the following properties:
  - `awsRequestId` (Node.js), `aws_request_id` (Python / Ruby) - random GUID string, does not emulate AWS UUID4 request IDs
  - `functionName` (Node.js), `function_name` (Python / Ruby) - identifiable function name string prefixed by `sandbox-`; does not use live production AWS CFN GUIDs
  - `functionVersion` (Node.js), `function_version` (Python / Ruby) - will always be `$LATEST`
  - `invokedFunctionArn` (Node.js), `invoked_function_arn` (Python / Ruby) - always `sandbox`
  - `memoryLimitInMB` (Node.js), `memory_limit_in_mb` (Python / Ruby) - your Lambda's configured memory amount


### Fixed

- Restored `ARC_INTERNAL` env var in Lambda invocations for Arc Functions
- Restored userland env vars to `@sandbox-startup` scripts; thanks @reconbot!
- Fixed case where `@ws` with no `@http` or `@static` would fail to start up

---

## [4.1.1] 2021-09-30

### Changed

- Restored missing ARC_SANDBOX_PATH_TO_STATIC in Lambda env vars for manual ASAP use; fixes #1231, thanks @andybee!

---

## [4.1.0] 2021-09-15

### Added

- Sandbox now accepts a `apigateway` option, in addition to `@aws apigateway` and `ARC_API_TYPE` env var
  - As before, valid options include: `http` (default if not passed), `httpv1`, `rest`
- Sandbox can now be shipped as a binary via `pkg`
  - Added a new GitHub Actions workflow to per-platform build binary versions and run integration tests


### Changed

- Route list now shows automatic static asset delivery at the root as mounting the public folder
- Projects that don't define root handlers will now load static assets from the root much, *much* faster!
- Internal: refactor to remove use of environment variables for passing data or config to various internals services, most notably the Lambda execution environment; fixes #1222
  - Lambda executions' env vars are now completely pure and clean, having no extraneous host system env vars
  - Sandbox no longer mutates env vars (with the exception of `ARC_ENV` and `NODE_ENV` if unset or altered by preferences, such as `@sandbox useAWS`)
  - Clean up any non-essential reliance tests may have on env vars previously populated by Sandbox
  - Refactor tests to also stop mutating env vars, and to better clean up after themselves
- Internal: refactor to more cleanly and consistently pass common parameters around through critical code paths
- Added better support for `ARC_ENV` (instead of relying on / using `NODE_ENV`), helpful for improving reliability when running alongside certain other libraries that mutate `NODE_ENV`


### Fixed

- Fixed local symlinking issue introduced in 4.0.2


---

## [4.0.3 - 4.0.4] 2021-09-14

### Changed

- Internal: Updated Architect Parser to v5
- Updated dependencies

---

## [4.0.2] 2021-09-05

### Changed

- Update dependencies; resolve breaking changes from `ws@8.0.0`
- Improved invocation behavior for JS functions where non-async handlers returning a Promise should not fail, thanks @reconbot!
- Improved WebSocket behavior when responding with !`200`; messages now respond with an error message instead of failing silently, thanks @reconbot!


### Fixed

- Fixed CLI when parsing larger port numbers (e.g. `--port 33333`); fixes #1023, thanks @filmaj + LumaKernel!
- Fixed inconsistent error reporting, thanks @reconbot!
- Disable filesystem watching of node_modules and .git by default; fixes #1213
- Fixed WebSocket disconnect firing when Sandbox shuts down, thanks @reconbot!

---

## [4.0.0 - 4.0.1] 2021-07-22

### Changed

- Breaking change: removed support for Node.js 10.x (now EOL, and no longer available to create / update in AWS Lambda)
- Breaking change: removed support for Architect 5 (and lower)
  - This change in reality should not impact anyone, as Architect 5 LTS releases haven't used modern versions of Sandbox for quite some time
- Breaking change: removed internal tables lookup at `/_asd`, deprecated in favor of Sandbox's proper internal service discovery
- Removed deprecated `@sandbox startup` warning
- Update and tidy up dependencies

---

## [3.7.4] 2021-06-30

### Added

- Added more detailed `context` for WebSocket (`@ws`) requests, thanks @reconbot!


### Changed

- Refactored and improved WebSocket tests, also thanks @reconbot!

---

## [3.7.3] 2021-06-24

### Added

- Populate Sandbox startup commands (`prefs.arc` `@sandbox-startup`) with `ARC_INV` env var, providing access to the project's Inventory object


### Fixed

- Ensure Sandbox startup commands respect `cwd`

---

## [3.7.2] 2021-06-22

### Fixed

- Attempted to fix Sandbox not terminating processes properly when running in Lambda due to Lambda not having *nix `ps`
- Hardened process termination testing

---

## [3.7.0 - 3.7.1] 2021-06-14

### Added

- Added `cwd` API param, making it easier to run Sandbox against one or many mock project directories in tests
- Added `@ws` route printing


### Changed

- Stopped making unnecessary Inventory calls during Sandbox / services startup, Sandbox now starts 10-25% faster most of the time
- Purified tests, removing all `process.chdir` calls (except those essential for testing the actual inferred working directory)
- Updated dependencies


### Fixed

- Fixed issue where CLI might take a long time to reload local routes (or not reload them at all) due to [issues related to Node.js stalling while closing its http server](https://github.com/nodejs/node/issues/2642)
- Fixed issue that could cause `sandbox.http.end()` and `sandbox.events.end()` to hang during tests
- Ensure plugin `invokeFunction` has all necessary params, fixes #1162
- Fixed issue where plugin functions might not be hydrated by Sandbox

---

## [3.6.0] 2021-05-24

### Added

- Internal change: added internal Arc service, including first service endpoint: SSM mock for proper internal service discovery to `aws-sdk` calls

---

## [3.5.1] 2021-05-19

### Fixed

- Fixed `@static spa` setting; thanks @timmak!

---

## [3.5.0] 2021-05-17

### Added

- Added new CLI flags for improved logging
  - `--quiet` (`-q`, `quiet`) - suppresses logging
  - `--verbose` (`v`, `verbose`) - additional Sandbox data related to your userland environment and invocations
  - `--debug` (`d`, `debug`) - debug Sandbox internals (handy for Sandbox development)


### Changed

- Cleaned up the output when triggering `@events` and `@queues` Lambdae


### Fixed

- Improved file watcher error logging and handling

---

## [3.4.3] 2021-05-05

### Fixed

- Undid change that unnecessarily added Inventory object to WS requests; fixes [#1121](https://github.com/architect/architect/issues/1121), thanks @pgte!
- Fixed an issue where Sandbox wouldn't kill a running Lambda if its configured timeout had expired, fixes [#1137](https://github.com/architect/architect/issues/1137), thanks @andybee!
- Sandbox will now print a warning to the console if any running Lambdas time out

---

## [3.4.2] 2021-04-19

### Fixed

- Sandbox now supports named `@indexes` (via the `name` parameter), fixes [#1122](https://github.com/architect/architect/issues/1122)

---

## [3.4.1] 2021-03-23

### Fixed

- Sandbox now works with an app composed of nothing but WebSockets, fixes [#1099](https://github.com/architect/architect/issues/1099)
- Sandbox can now handle non-JSON a bit more gracefully without blowing up, fixes [#1093](https://github.com/architect/architect/issues/1093); thanks @reconbot!
- Handle multiple cookies according the spec, fixes [#1090](https://github.com/architect/architect/issues/1090); thanks @zaverden!
- Fixed unnecessary warning generated regarding using aws-sdk as a dependency in production; thanks @andybee!

---

## [3.4.0] 2021-03-02

### Added

- Support for beta `@plugins` sandbox `start` and `end` service hooks
  - Enables plugin authors to hook into sandbox, providing a local development experience for consumers of their plugin
- Added `invokeLambda` (via `require('@architect/sandbox/invokeLambda')`) plugin helper method
  - Enables plugin authors to invoke Lambdas that their plugin creates during sandbox execution

---

## [3.3.8] 2021-03-17

### Added

- Internal change: added internal service discovery endpoint

---

## [3.3.7] 2021-03-02

### Added

- Gracefully handle file watcher limit error; thanks @mawdesley!

### Fixed

- Gracefully error if malformed JSON is passed to the `@events` bus server.

---
## [3.3.6] 2021-01-27

### Added

- Added environment `PYTHONPATH` to local Lambda executions (if present), thanks @scoates!

---

## [3.3.5] 2021-01-18

### Fixed

- Fixed minor typo in inaccessible dependency warning; thanks @jeremyw!

---

## [3.3.4] 2021-01-01

### Added

- Added `@sandbox-startup` preferences support, fixes #1032; thanks @rbethel!


### Changed

- Deprecated the wonky and sometimes broken `@sandbox startup` setting (in favor of the above `@sandbox-startup` pragma)
- Make passing options object to Sandbox service methods, uh, optional
- The startup icon is now a Unicode heart
- Updated dependencies


### Fixed

- Fixed false positive dependency warnings when Lambda treeshaking encounters a `shared` or `views` directory with its own package.json file and dependencies; thanks @exalted
- Fixed optional log suppression on a couple startup prints; fixes #1045, thanks @mikemaccana!

---

## [3.3.1 - 3.3.3] 2020-12-06

### Changed

- Update (and limit) out of bounds dependency warnings to take into account Hydrate autoinstall during deploy
- Partially style error views
- Internal change: move `src/helpers` to `src/lib`


### Fixed

- Fixed alternative handler file checks when using Deno; fixes #1022
- Fixed formatting in unknown `@http` userland error state
- Fixed middleware handling `ARC_SANDBOX_ENABLE_CORS`; thanks @neilhoff!
- Fixed serving bare `@static` (i.e. S3-only with no `@http`) apps; fixes #1031, thanks @dam!
- Fixed issue where `any /*` could clobber the ability to send `@ws` messages locally; fixes #1039, thanks @mikemaccana!

---

## [3.3.0] 2020-12-03

### Added

- Added support for new `@shared` pragma with selective shared code, uh, sharing
- Added support for custom shared + views file paths
- Added support for global preferences lookup (`~/.preferences.arc` + `~/.prefs.arc`, etc.)
- Added response payload size validation; `@http` Lambdas with >6MB responses will now fail gracefully; thanks @andybee!


### Changed

- Updated dependencies

---

## [3.2.2]

### Added

- Development instructions in the readme for those wanting to hack, test, and iterate on Sandbox locally

---

## [3.2.1] 2020-11-28

### Fixed

- Gracefully fail when Sandbox startup script does not supply sufficient arguments; partially fixes #1019, thanks @filmaj!

---

## [3.2.0] 2020-11-23

### Added

- Added support for custom file paths in all function types
- Added support for new local preferences (`preferences.arc` or `prefs.arc`) file
  - Add Sandbox preferences with `@sandbox`
    - `@env` (generated by running `arc env`, or added manually) populates environment variables
    - `create false` disables the local filesystem creator
  - Example:
```arc
@sandbox
create false # disables automatic function creation
startup
  echo 'Hi there!'
  npm run test
  node some/arbitrary/script.js

@env
testing
  AN_ENV_VAR somethingUseful
```
- Added `.env` support; thanks @wesbos!
- Added missing Lambda handler error, and made ever so slightly nicer the error message presentation


### Changed

- Breaking change on the Sandbox startup init script beta: existing startup scripts have replaced by startup preferences (`@sandbox startup`, see above)
  - `scripts/sandbox-startup.[js|py|rb]` must now be executable and callable from a shell via startup preferences (e.g. `node scripts/sandbox-startup.js`)
- Implemented Inventory (`@architect/inventory`)
- Removed legacy (and I do mean *legacy*) auto-initialization of `arc-sessions` table from Arc <5
  - Still initializing `{appname}-{env}-arc-sesssions` tables, though
- Added more (hopefully) helpful environment-related init logging:
  - Which environment is being loaded
  - Whether Sandbox found any env vars for the current environment
  - Whether Sandbox is using any live AWS infra (via prefs or `ARC_LOCAL`)
- Sandbox no longer creates missing Lambda resources by default; to reenable that, add to your preferences file:
```arc
@create
autocreate true
```


### Fixed

- Fixed wonky order of env population message printing in Sandbox

---

## [3.1.3] 2020-10-19

### Fixed

- Fixed weird side effects that can sometimes occur when toggling between symlink enabled/disabled with `@aws shared false` in a function config


### Changed

- Improved rehydration behavior in CLI when symlinking is enabled
- Removed unnecessary dependency accidentally added in 3.1.0

---

## [3.1.1 - 3.1.2] 2020-10-18

### Added

- Internal change: laid some groundwork in Lambda invoker for new customization coming via Inventory


### Fixed

- Fixed obscure false positive missing dependency warning when `src/shared` is symlinked, and something in `src/shared` requires a module that's assumed to be in the function, but not in `src/shared`. It's weird, I know, but it can happen!
- Fixed another obscure false positive missing dependency warning when `src/shared` is symlinked, and something in `src/shared` requires a module that's only found in `src/shared`, but not in the function itself. Maybe slightly less weird, but it can def happen!

---

## [3.1.0] 2020-10-15

### Added

- Added support for symlinking shared code into functions (`src/shared` and `src/views`), which vastly improves Sandbox performance
  - Large projects utilizing shared code will see a 10-50x performance improvement on startup, and changes to shared code are now instantly reflected across all local functions
  - To drop back into file-copying mode, invoke sandbox with `--disable-symlinks` (or if using Sandbox via API, pass `symlink: false` in your options object)
  - If you are using `@static fingerprint true`, you will see a symlinked `static.json` in your `src/shared` folder. Feel free to add it to your .gitignore; while it isn't hurting anything, it will be dealt with in a future release
  - Legacy Windows operating systems that don't support symlinking will continue to copy shared code upon startup like some kind of hethen
  - Shout out to @joliss!

---

## [3.0.4 - 3.0.5] 2020-10-12

### Changed

- 3x expansion of integration test coverage (572 to 1784 integration tests)
- Internal change: Refactored and better documented body parsing middleware predicates


### Fixed

- Sandbox now responds to requests to root with only `/:param` defined in `HTTP` APIs, fixes #981
- Improved root handling + ASAP fallthrough behavior
- Fixed obscure false negative for adding Arc Static Asset Proxy when `@http` contains a route that looks like `get /:hey/there`
- Fixed parsing of duplicate query string params in deprecated (Arc v5) mode
- Fixed shutdown errors when using an external local DB, thanks @herschel666!
- Fixed issue where default region may prevent connections to external local DB, thanks @exalted!
- Fixed issue where WebSocket send events may fail in `HTTP` mode, thanks @grncdr!
- Fixed issue where paths with a param and catchall (e.g. `/:item/*`) had malformed request payloads, fixes #983

---

## [3.0.0 - 3.0.3] 2020-10-08

### Added

- Added support for `@http` catchall syntax (e.g. `get /api/*`)
- Added support for `@http` `any` method syntax (e.g. `any /path`)
- Added support for `@http` `head` + `options` methods
- Added experimental support for `@proxy`
- Added basic `requestContext` to `REST` API requests

### Changed

- Breaking change: with the addition of `@http` `any` and `*`, default `get /` greedy catchall is now deprecated
  - To restore that behavior, either move your `get /` route to `any /*`, or just define a new `any /*` route
- Updated dependencies


### Fixed

- Merged in patch from `2.0.4` to fix projects with `@ws`

---

## [2.0.4] 2020-10-08

### Fixed

- Fixed issue where projects with `@ws` fail to start up, thanks @grncdr!

---

## [2.0.2 - 2.0.3] 2020-10-06

### Changed

- Removed startup notice regarding Sandbox defaulting to `HTTP` API emulation mode


### Fixed

- Fixed regression when using a non-Sandbox DynamoDB instance via the `ARC_DB_EXTERNAL` env var, thanks @herschel666 & @m-butler!

---

## [2.0.1] 2020-09-29

### Changed

- Updated dependencies

---

## [2.0.0] 2020-09-15

### Added

- Added support for API Gateway `HTTP` APIs (with v1.0 and v2.0 payload formats)
  - API type configuration:
    - Valid settings: `http` (default), `httpv2` (aliased to `http`), `httpv1`, and `rest`
    - `http` + `httpv2` uses the latest API Gateway payload format (v2.0)
      - If you'd like to use `HTTP` APIs with code authored for an existing `REST` API project, manually specify the v1.0 payload format with `httpv1`
    - Backwards compatibility for `REST` APIs is retained with `rest` setting
    - More info: https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api.html
  - Your API type can be specified in the Architect project manifest as `@aws apigateway {type}`, or with the `ARC_API_TYPE` env var
  - API Gateway `HTTP` APIs as the new default API type in Sandbox **may be a breaking change for local workflows with existing projects**
    - If so, per above, make sure you set to `REST` mode with `ARC_API_TYPE=rest` or add that configuration to your project manifest
    - Existing projects with API Gateway `REST` APIs will remain unchanged and will continue to deploy safely, even though Sandbox now defaults to `HTTP`
- Added unified service interface and nascent API for Sandbox modules
- Sandbox itself and its various service modules (`http`, `events`, and `tables`) now have a consistent API to improve using Sandbox in your test suites
  - All Sandbox module methods now accept an options object, and can either return a Promise (e.g. can be used in async/await), or accept an optional callback
  - Additionally, all Sandbox module methods now properly set their own environment variables, hydrate any necessary dependencies, and handle any other necessary service startup routines
  - `sandbox.start()` and `.end()` start and end all Sandbox services:
    - `sandbox.start(options[, callback]) → [Promise]`
    - `sandbox.end([callback]) → [Promise]`
  - `http.start()` and `.end()` starts and ends just the HTTP / WebSocket service:
    - `http.start(options[, callback]) → [Promise]`
    - `http.end([callback]) → [Promise]`
  - `events.start()` and `.end()` starts and ends just the event bus service:
    - `events.start(options[, callback]) → [Promise]`
    - `events.end([callback]) → [Promise]`
  - `tables.start()` and `.end()` starts and ends just the local DynamoDB service:
    - `tables.start(options[, callback]) → [Promise]`
    - `tables.end([callback]) → [Promise]`
- ~3x expansion of test coverage:
  - Integration test suite expanded by 3x (124 to 358 integration tests)
  - Unit test suite expanded by 2.5x (432 to 1,090 unit tests)


### Changed

- A number of seldom used and largely undocumented Sandbox module APIs have a number of breaking changes:
  - `sandbox.start()` no longer returns a function to shut down, and should now be shut down directly with `sandbox.end()`
  - `sandbox.db()` is now `sandbox.tables()`
  - `http.close()` is now `http.end()`
  - `events.start()` & `tables.start()` no longer return server objects to be invoked with `.close()`, and should now be shut down directly with `events.end()` and `tables.end()`


### Fixed

- Fixed issue where Lambda timeouts were only respected if >3 seconds; now >=1 second is valid
- Refactored Arc v6 response support for multiValueHeaders to better accommodate use cases where headers & multiValueHeaders are not in conflict with each other

---

## [1.13.3] 2020-09-14

### Fixed

- Un-break Lambda invocation if an object is present in `.arc-config`


### Changed

- Updated dependencies

---

## [1.13.2] 2020-09-08

### Changed

- Updated dependencies


### Fixed

- Fixed Deno issues on Windows (and added Deno to CI + integration tests), /ht @petruki

---

## [1.13.1] 2020-08-27

### Changed

- Updated dependencies


### Fixed

- Fixed `process.stdin.setRawMode is not a function` error that may occur in certain circumstances; thanks @kristoferjoseph!

---

## [1.13.0] 2020-07-05

### Added

- Added (exprimental) support for manual rehydration while running:
  - Press `shift` + `H` to rehydrate all shared files
  - Press `shift` + `S` to rehydrate src/shared
  - Press `shift` + `V` to rehydrate src/views
  - Fixes #902, ht @andybee!

---

## [1.12.7] 2020-07-01

### Fixed

- Improves compatibility with production REST API behavior for non-get requests to root; fixes #900 /ht @andybee

---

## [1.12.6] 2020-06-24

### Added

- Added experimental support for manually opting into [AWS's Java-based local DynamoDB](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.DownloadingAndRunning.html); thanks @m-butler!

---

## [1.12.4 - 1.12.5] 2020-06-23

### Changed

- Updated dependencies


### Fixed

- Fixed unsetting `@tables encrypt` setting locally; fixes #785, thanks @filmaj! /ht @m-butler

---

## [1.12.3] 2020-06-21

### Added

- Added support for `@static spa true|false`


### Changed

- Updated dependencies
- Response header casing now matches API Gateway (read: everything is lower-cased)
- Internal change: implemented new code standard with `@architect/eslint-config`


### Fixed

- Fixed proxy lookup to custom 404 page
- Fixed incorrect filename in proxy 404 error message
- Response headers are now remapped (and in some cases dropped) per observed behavior in API Gateway
  - Worth noting, this follows *actually observed* API Gateway behavior; what's published in their docs (link below) has been known to differ from reality
  - https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-known-issues.html
  - Fixes #879; /ht @andybee
- Fixed duplicate generation of table attribute definitions, fixes #828; thanks @filmaj, ht @exalted

---

## [1.12.2] - 2020-06-04

### Changed

- Sandbox support for Deno updated for `1.0.5` and entry now looks for `index.{js,ts,tsx}` and `mod.{js,ts,tsx}`

---

## [1.12.1] 2020-06-01

### Changed

- Sandbox support for Deno updated for `1.0.3`; now forces reload every invocation

---

## [1.11.0 - 1.12.0] 2020-05-22

### Fixed

- Web socket `connectionId` was getting overwritten by concurrent client connections
- Sending a message to a `connectionId` before it has connected should emit a `GoneException`
- h/t @andybee for helping track this down 🔍

----

## [1.10.0] 2020-05-17

### Added

- Adds Yarn support for hydration
- Improved default caching behavior for static assets; fixes #273
  - Any assets that don't have `cache-control` explicitly set will now default to using `ETag` in order to improve the reliability of cache invalidation
  - HTML & JSON responses still default to anti-caching headers
- Added path peeking (aka pretty URLs)
  - Example: to load `/foo/index.html`, you used to have to request `/foo/`
- Added ETag support to Sandbox static asset serving

### Fixed

- Fixed `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` error in Node.js 14; fixes #780, ht @stegosource

---

## [1.9.6] 2020-04-22

### Added

- Adds support for `multiValueHeaders` in response object; fixes #764, thanks @andybee!


### Fixed

- Fixed an issue where `multiValueHeaders` may conflict with `headers` values for `Content-Type`; thanks @andybee!
- Fixed an issue where errors weren't being handled if the database port conflicted on startup; thanks @exalted!
- Fixed `Deno.env()` became `Deno.env.toObject()` for the impending 1.x release

---

## [1.9.5] 2020-04-18

### Fixed

- Updated dependency status checker, fixes false positive rehyhdration of packages installed by archive or git repo

---

## [1.9.4] 2020-04-16

### Added

- Added Sandbox watcher pausing
  - The presence of `_pause-architect-sandbox-watcher` in your operating system's `$TMP` directory (usually `/tmp` or `c:\windows\temp`) will temporarily pause the Sandbox watcher
  - This is useful when combined with tools like `lint-staged` to ensure automated file stashing within `src/shared` and `src/views` doesn't result in hydration failures
  - Sandbox cleans up this file on startup, jic


### Changed

- Improved missing dependency warning to provide better instructions on how to install a missing dependency if the function in question does not already have a `package.json` file; /ht @exalted


### Fixed

- Fixed issue where explicit (or empty) returns would provide a red herring error
- When a non-existent `@events` Lambda is invoked, Sandbox will now gracefully fail

---

## [1.9.3] 2020-04-08

### Fixed

- Sandbox should now restore the terminal cursor more reliably when quit
- Preserve leading/trailing whitespace from console logging
- Fixed issue where `.arc-config` files with an `@aws timeout` value of exactly `900` (15 minutes) would not be respected

---

## [1.9.2] 2020-04-06

### Added

- Adds console logging for uncaught exceptions in async functions in Node.js and Deno; /ht @coco98


### Changed

- Updated dependencies


### Fixed

- Sandbox should now restore the terminal cursor more reliably when shut down

---

## [1.9.1] 2020-03-31

### Fixed

- Updated the call to start Sandbox in Architect 6 such that it will now actually initiate the filesystem watcher

---


## [1.9.0] 2020-03-29

### Added

- Adds warning for out of bounds dependency loads
  - This helps to ensure that potential side effects of running Node.js locally – such as the `require` algorithm traversing the filesystem outside the boundaries of the function in question – are less likely to be discovered after deploying to live AWS infra

---

## [1.8.2 - 1.8.3] 2020-03-24

### Added

- Lambda's payload size limits are now respected and mocked; payloads exceeding 6MB will fail to execute, as they would in AWS


### Changed

- Updated dependencies


### Fixed

- Fixes issue where HTTP requests with large body payloads error with E2BIG; fixes #639, /ht @dawnerd

---

## [1.8.1] 2020-03-22

### Changed

- Minor improvements to auto-generated boilerplate function files
- Updated dependencies


### Fixed

- `.arc-env` env vars now support a wider variety of special characters (such as `+`, `@`, `#`, etc.) if quoted, e.g. `FOO "sp#ci@lch+rs"`; fixes #638
- Fixed Architect project manifest syntax errors and error reporting

---

## [1.8.0] 2020-03-18

### Added

- Added support for running without an existing Architect project manifest


### Changed

- Updated dependencies


### Fixed

- Query string arrays like `?ids=1&ids=2&ids=3&ids=4` are now consistent with API Gateway's request `multiValueQueryStringParameters` property
  - Previously, the array-like value was available as an object in `request.queryStringParameters` (and `request.query` in Arc 5 mode) which was inconsistent with API Gateway

---

## [1.7.3] 2020-03-17

### Changed

- Updated dependencies

---

## [1.7.2] 2020-02-29

### Added

- Added mocking of AWS's `multiValueHeaders` into `req`
- Also added mocking of the headers AWS drops from requests


### Fixed

- Fixes differences between AWS's inconsistent header casing and our existing lowcase-normalized header casing; fixes #698

---

## [1.7.1] 2020-02-13

### Changed
- Sandbox now ensures `NODE_ENV` is one of `testing`, `staging`, or `production` (defaulting to `testing`)


### Fixed

- Fixed issue where pulling changes down with git (or Mercurial) would not trigger filesystem changes; fixes #673
- Improves reliability of using Sandbox with certain test harnesses that may automatically set `NODE_ENV`

---

## [1.7.0] 2020-02-05

### Added

- Added support for running multiple Sandboxes at the same time; fixes #635
  - No more conflicting events and ports when running multiple simultaneous local Architect projects
  - Also, you can now manually configure your `@events` port with `ARC_EVENTS_PORT`, and `@tables` port with `ARC_TABLES_PORT`
  - Note: while unlikely, if you already manually specify your Sandbox's port, this may be a breaking change to your local workflow in two circumstances:
    - 1) You use Architect Functions; to fix, upgrade to Functions `3.6` or later
    - 2) You hardcode an `@events` client to port `3334` or DynamoDB client to port `5000`; you should now read the ports from `ARC_EVENTS_PORT` and `ARC_TABLES_PORT`
    - This change is **NOT breaking to any live AWS / production infra**

---

## [1.6.1] 2020-02-05

### Fixed

- Fixed AWS credential instantiation to ensure that missing `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` env vars are backfilled with dummy values in scenarios where valid credentials are not required

---

## [1.6.0] 2020-02-02

### Added

- Better support for quiet mode:
  - Via params: `sandbox.start({quiet: true})`
  - Via env vars: `ARC_QUIET` (or legacy `QUIET`)
  - Fixes #621; thanks @konsumer!
- Adds discrete `sandbox.end([callback])` method for shutting down the Sandbox in test environments
  - This method takes an optional callback or returns a promise
- Sandbox now sets the `ARC_CLOUDFORMATION` env var used by Architect Functions and other libs
  - This only occurs when running Sandbox against live infra (specifically: `NODE_ENV` = `staging` || `production`),


### Changed

- When called as module, `sandbox.end` now calls an optional callback or returns a promise; fixes #622, thanks @konsumer!
- Sandbox now only starts the `@events` + `@queues` bus and `@tables` DB when called for by the Architect project manifest


### Fixed

- Improved logging for WebSocket invocations to be less confusing about potential non-error states when message action not found; fixes @sandbox#228
- Fixed potential destructuring bug in `sandbox.start`

---

## [1.5.8] 2020-01-29

### Fixed

- Fixed secondary index (`@indexes`) naming schema issue introduced with Architect 6; fixed #45, thanks @eshikerya & @konsumer


### Changed

- Updated dependencies

---

## [1.5.7] 2020-01-23

### Fixed

- Fixed local WebSocket port in `ARC_WSS_URL`

---

## [1.5.5 - 1.5.6] 2020-01-22

### Added

- Added `ARC_WSS_URL` env var on startup (matches the environment variable behavior of Architect 6.0.25); fixed #225


### Changed

- Updated default Lambda runtime to `nodejs12.x` (formerly `nodejs10.x`)
- Updated dependencies

---

## [1.5.4] 2020-01-08

### Fixed

- Fixed regression related to missing `aws-sdk` dependency errors

---

## [1.5.2 - 1.5.3] 2020-01-07

### Added

- Added `verbose` CLI flag (`-v, --verbose, verbose`) and verbose-only dummy credentials warning


### Changed

- Update dependencies

---

## [1.5.1] 2020-01-06

### Fixed

- Fixed errors related to missing `aws-sdk` dependency

---

## [1.5.0] 2019-12-19

### Added

- Sandbox now supports Deno runtime projects!

---

## [1.4.19] 2019-12-12

### Added

- Sandbox now passes full request params from WebSocket clients on `connect` and `disconnect`
  - Now in addition to `request.requestContext.connectionId`, you'll have `request.headers`, and `request.queryStringParameters` (if present)
  - Sandbox now only passes `request.body` to WebSocket functions that receive `message`s (instead of adding an empty `body` object to all requests)


### Changed

- Adds better backwards compatibility support for legacy `src/ws/ws-*` WebSocket function paths

---

## [1.4.18] 2019-12-10

### Added

- Added proper emulation of API Gateway v2's WebSocket connection authorization
  - Returning an object containing `statusCode` 2xx allows a WebSocket client to connect
  - Returning any other status code will hang up on the request

---

## [1.4.17] 2019-11-19

### Added

- Added support for `nodejs12.x` and `python3.8` runtimes


### Changed

- Updated dependencies


### Fixed

- Fixed printing of unnecessary ANSI escape characters in CI environments (`CI` env, or not TTY output)

---

## [1.4.16] 2019-11-19

### Fixed

- Fixed issue where `public/` may be automatically generated if `@static folder` is defined

---

## [1.4.15] 2019-11-19

### Added

- Root requests now look for default `index.html` when `ARC_STATIC_SPA=false`

### Changed

- Adds anti-caching and body parsing `application/vnd.api+json`; resolves #141, thanks @jkarsrud!

---

## [1.4.14] 2019-10-29

### Added

- `request.parameters` and `request.pathParameters` are now properly passed through for root proxy requests


### Changed

- Updated dependencies

---

## [1.4.13] 2019-10-19

### Changed

- Updated dependencies


### Fixed

- Removed unnecessary dependency

---

## [1.4.10 - 1.4.12] 2019-10-17

### Changed

- Internal change: swaps out `utils/init` for `@architect/create`

### Fixed

- Fixes issue when `@tables` definition includes `stream true`; resolves #47, thanks @gr2m!

---

## [1.4.8 - 1.4.9] 2019-10-15

### Added

- Added update notifier to help ensure folks are running the (hopefully) least buggy, most stable, most secure version of Sandbox


### Changed

- Updated dependencies

### Fixed

- Improves error states for missing static configs, 404s, etc. when using `@http` and/or `@static` with `arc.http.proxy` or without defining `get /`

---

## [1.4.7] 2019-10-14

### Changed

- Legacy WebSockets paths on the filesystem are now formally deprecated
  - Your default three WebSockets paths should be: `src/ws/default`, `src/ws/connect`, `src/ws/disconnect`
  - If you're using legacy WebSockets paths (either `src/ws/ws-default` or `src/ws/ws-$default`), simply remove `ws-[$]` and you should be all set!


### Fixed

- Fixed issue when emitting to WebSockets with Arc Functions (`arc.ws.send`); resolves #48, thanks @andybee + @bvkimball!
- Fixed issue where `sandbox` may not have correctly resolved some custom WebSocket actions
- Fixed HTTP request with `body` and no `Content-Type` header; resolves #102, thanks @andybee!
- Fixed issue where killed subprocesses would not trigger timeouts; resolves #30, /ht @mikemaccana
- Fixed issue where functions with legacy runtimes may not have been fully hydrated

---

## [1.4.6] 2019-10-11

### Changed

- Updated dependencies

---

## [1.4.4 - 1.4.5] 2019-10-10

### Added

- Added support for `@static fingerprint true` in root spa / proxy requests
  - Also includes support for build-free calls between your fingerprinted static assets
    - Example: in `public/index.html`, use the following syntax to automatically replace the local / human-friendly filename reference to the deployed fingerprinted filename:
    - `${arc.static('image.png')}` will be automatically replaced by `image-a1c3e5.png`
    - Or `${STATIC('image.png')}` (which is the same thing, but shoutier)
    - Note: although those look like JS template literal placeholders, they're intended to live inside non-executed, static files within `public/` (or `@static folder foo`)


### Changed

- Updated dependencies


### Fixes

- Fixes root spa / proxy requests when Architect and/or Sandbox are globally installed; resolves #92 /ht @grahamb

---

## [1.4.1 - 1.4.3] 2019-09-29

### Added

- Startup auto-hydration now hydrates `src/views` and `src/shared`


### Changed

- Updated dependencies


### Fixed

- When auto-hydrating functions upon startup, `sandbox` no longer hydrates `src/views` and `src/shared` with each function

---

## [1.4.0] 2019-09-26

### Added

- Auto-hydration received a bunch of nice upgrades:
  - Auto-hydration now detects changes to the state of your installed Node dependencies, and rehydrates if necessary; for example:
    - You're working on a project, and a teammate updates a dependency in `get /foo` from version `1.0.0` to `1.1.0`
    - Upon your next git pull, `sandbox` will detect the dependency update in `get /foo` and automatically install version `1.1.0` for you
  - Auto-hydration now has a rate limit of one change every 500ms to prevent recursive or aggressive file updates
  - Auto-hydration now has `@static folder` support
  - Auto-hydration now only hydrates the shared files necessary
    - For example: if you change a file in `src/views`, it will only update your `@views` functions, and not attempt to rehydrate all your project's functions with `src/shared`
  - Events now have a timestamp and improved formatting
- Beta: `sandbox` init script support!
  - `sandbox` will now run the init script of your choosing upon startup after all subsystems have started up:
    - `scripts/sandbox-startup.js` - a CommonJS module, receives your parsed Arc project as a parameter, supports async/await
    - `scripts/sandbox-startup.py` - a Python script
    - `scripts/sandbox-startup.rb` - a Ruby script


### Changed

- Improvements to auto-hydration of `src/shared` and `src/views` upon startup
- Improvements to the conditions under which the HTTP server starts, shuts down, and restarts; fixes #65
- Improved async error copy (displayed when execution does not complete)
- Proxied requests now sends a proper `req.resource`, which can resolve some SPA bugs, esp when used with newer Arc Functions
- `sandbox` now respects and errors on invalid response params for proper Architect 6 compatibility; fixes #49
- Updates Dynalite to `3.0.0`, thanks @mhart!
- Better 404 / file missing handling in `sandbox` when using `http.proxy` (or loading assets without `@http get /` specified)


### Fixed

- Fixed issue where in certain circumstances `get /` wouldn't reload after a change to the project manifest
- Minor fix where if you specified a `SESSION_TABLE_NAME` env var outside of `.arc-env`, `sandbox` won't clobber it
- Fixed caching headers for various error states (async, timeout, etc.) to ensure your browser won't accidentally cache an error response

---

## [1.3.14] 2019-09-16

### Changed

- Internal change: moves vendored HTTP proxy bundle into node module
- This change incorporates a number of fixes by way of `@architect/functions` (see below)


### Fixes

- Fixes issue where binary assets delivered via `sandbox` / root may not be properly encoded
- Fixes issue where `http.proxy.public` + `http.proxy.read` may not have delivered correctly formatted responses in an Architect 5 environment

---

## [1.3.13] 2019-09-15

### Fixed

- Fixes callback error when auto-rehydrating `src/shared` and `src/views`

---

## [1.3.12] 2019-09-13

### Fixed

- Fixes empty mock `context` object encoding

---

## [1.3.10 - 1.3.11] 2019-09-09

### Fixed

- HTTP posts with empty bodies will no longer hang on request
- `sandbox.close` will no longer throw an error if project doesn't use `@http` or `@ws`

---

## [1.3.9] 2019-08-28

### Changed

- Patches vendored proxy bundle to 3.3.7
- Updated deps

---

## [1.3.8] 2019-08-24

### Changed

- Tweaks Ruby execution to more closely align with cloud vendor behavior

---

## [1.3.7] 2019-08-22

### Fixed

- Fixes automatic dependency hydration during startup

---

## [1.3.1 - 1.3.6]

Notes coming shortly!

---

## [1.3.0]

### Added

- Support for Architect 6
  - Includes complete compatibility for Architect 4 + 5 users
  - Adds new built-in body parser for Arc 6 emulation
- Responses now include the same content type aware `Cache-Control` defaults as found in Architect 5
  - As always, they're able to be overriden with `cacheControl` param in Functions, or `headers['Cache-Control']`

### Fixes

- Better emulation of proper AWS behavior when delivering binary responses

### Changed

- Hopefully nothing breaking – please send feedback on the RC!
  - 1.3 RC: https://github.com/architect/sandbox/issues/36
  - Slack: https://architecture-as-text.slack.com

---

## [1.2.11] 2019-08-06

### Fixed

- Fixes dependency-free responses with `content-type` header set /ht @herschel666

---

## [1.2.10] 2019-08-05

### Fixed

- Resolves issue where static assets aren't loading from `_static/`, fixes #416

---


## [1.2.7 - 8] 2019-07-31

### Added

- Enables easier creation of static web apps by allowing `sandbox` to run only with `@static`
  - In Architect 6, you will not need to specify or use `@http` routes in order to deliver web apps

---

## [1.2.6] 2019-07-23

### Fixed

- Fixed issue preventing Ruby functions from properly executing
- Fixed issue prevent Python functions from properly executing in Windows
- Fix broken characters in Windows console

### Changed

- Context now passes an empty object (to be mocked soon!) to all runtimes
  - This deprecates the legacy AWS implementation of `context` (since retired in production) passed to `sandbox` Node functions
- Reorganized tests, added code coverage reports

---

## [1.2.5] 2019-07-17

### Added

- Adds auto-hydration to new functions without restarting `sandbox`


### Fixed

- Fixes issue with auto-hydration on `sandbox` startup

---

## [1.2.4] 2019-07-15

### Added

- Expanded support for static asset fingerprinting! If you've enabled fingerprinting (`@static fingerprint true`):
  - `sandbox` will regenerate your `public/static.json` file on startup
  - And whenever making any changes to your `public/` dir, `sandbox` auto-refresh will automatically regenerate `public/static.json` and re-hydrate your shared files with the latest version


### Fixed

- Auto-refresh now detects file deletions from `src/shared` and `src/views`

---

## [1.2.3] 2019-07-12

### Added

- Expanded tests, code coverage, and Appveyor testing for Windows


### Fixed

- Fixes crashing when `get /` and other functions aren't defined in `.arc` or present in the filesystem, but are requested by a client
- Prevents startup of http server if `@http` isn't defined in `.arc`

---

## [1.2.2] 2019-07-10

### Added

- Adds PYTHONPATH to `sandbox` Lambda invocation for `/vendor` modules


### Fixed

- Fix sandbox working on Windows by normalizing seperators to Unix

---

## [1.2.1] 2019-07-03

### Added

- Support naked WebSocket paths

---

## [1.2.0] 2019-06-26

### Added

- Auto-refresh! `sandbox` now keeps an eye out for the following changes to your project:
  - Edits to your Architect project manifest will mount or unmount HTTP routes without having to restart `sandbox`
  - Changes to `src/shared` and `src/views` will automatically rehydrate your functions' shared code
  - More to come!


### Changed

- Prettied up initialization printing
- Improved CLI tests

---

## [1.1.0-1] 2019-06-25

### Added

- Auto-hydration!
  - Say goodbye to running `npx hydrate` before starting new projects, cloning existing projects, or pulling down new functions
  - On startup, any functions missing dependencies on the local filesystem will now be auto-hydrated

---

## [1.0.11-13] 2019-06-24

### Added

- Additional testing for `sandbox` CLI, and of sync and async calls as a module


### Fixed

- Ensures `sandbox` starts when local db initializes in the cases of:
  - No local AWS credentials file (e.g `~/.aws/credentials`)
  - The local AWS credentials file is present, but is missing the requested profile name
  - Fixes #382, 391

---

## [1.0.8-10] 2019-06-18

### Changed

- Moves `sandbox` port assignment logic into this module (as opposed to various caller implementations)

---

## [1.0.7] 2019-06-17

### Changed

- Print earlier, faster, more helpful startup messages


### Fixed

- Fixed gnarly little bug with missing Arc-supported runtimes

---

## [1.0.5-6] 2019-06-13

### Changed

- Updates `utils`, moves some project config bootstrapping out of `sandbox` into `utils`


## Fixed

- Better handling of missing project manifest

---

## [1.0.4] 2019-06-12

### Added

- Enables sandbox to run independently via CLI (`npx sandbox`)

---

## [1.0.3] 2019-06-11

### Changed

- Uses shared banner printer
- Tidies up test suite and adds a few new tests
- Updates dependencies

---

## [1.0.2] 2019-05-29

### Fixes

- Corrects URI encoding when accessing local static assets in `_static/`, fixes #390

---

## [1.0.1] 2019-05-30

### Added

- This here library! Broken out of `@architect/architect`, we will now be maintaining `sandbox` as a standalone module, and reincorporating it back into future versions of Architect.

---

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
