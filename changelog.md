# Architect Sandbox changelog

---

## [1.12.6] 2020-06-24

### Added

- Added experimental external support for manually opting into [AWS's Java-based local DynamoDB](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.DownloadingAndRunning.html); thanks @m-butler!

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
