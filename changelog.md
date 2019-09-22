# Architect Sandbox changelog

---

## [On master] 2019-09-22

### Added

- Auto-hydration now detects changes to the state of your installed Node dependencies, and rehydrates if necessary; for example:
  - You're working on a project, and a teammate updates a dependency in `get /foo` from version `1.0.0` to `1.1.0`
  - Upon your next git pull, `sandbox` will detect the dependency update in `get /foo` and automatically install version `1.1.0` for you
- Auto-hydration now has a rate limit of one change every 500ms to prevent recursive or aggressive file updates
- Auto-hydration now has `@static folder` support


### Changed

- Improvements to auto-hydration of src/shared and src/views upon startup
- Improved async error copy (displayed when execution does not complete)

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
