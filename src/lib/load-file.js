let { existsSync, readFileSync } = require('fs')

/**
 * Loads a userland file given an extensionless path, file being either a js, cjs, mjs or json file.
 * @param {string} filepath Full path to a file without its extension
 */
async function loadFileWithoutExtension (filepath) {
  let json = `${filepath}.json`
  let js = `${filepath}.js`
  let mjs = `${filepath}.mjs`
  let cjs = `${filepath}.cjs`
  if (existsSync(json)) return JSON.parse(readFileSync(json))
  let mods = [ js, mjs, cjs ]
  for (let mod of mods) {
    if (existsSync(mod)) return await loadModule(mod)
  }
  return null
}

/**
 * Loads an ECMAScript module, handling module loading differences across node.js versions
 * @param {string} filepath Full path to a file
 */
async function loadModule (filepath) {
  let mod
  try {
    mod = require(filepath)
    if (process?.features?.require_module === true && mod.default) {
      mod = mod.default
    }
  }
  catch (err) {
    if (hasEsmError(err)) {
      let path = process.platform.startsWith('win')
        ? 'file://' + filepath
        : filepath
      let imported = await import(path)
      mod = imported.default ? imported.default : imported
    }
    else {
      throw err
    }
  }
  return mod
}
let esmErrors = [
  'Cannot use import statement outside a module',
  `Unexpected token 'export'`,
  'require() of ES Module',
  'Must use import to load ES Module',
]
let hasEsmError = err => esmErrors.some(msg => err.message.includes(msg))

module.exports = { loadFileWithoutExtension, loadModule }
