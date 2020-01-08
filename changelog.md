# Architect Sandbox changelog

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
