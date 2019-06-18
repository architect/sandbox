# Architect Sandbox changelog

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
