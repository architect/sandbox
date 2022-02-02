module.exports = function swapEnvVars (env) {
  let backup = {}
  Object.keys(env).forEach(k => {
    if (process.env[k]) backup[k] = process.env[k]
  })
  function swap () {
    Object.keys(env).forEach(k => process.env[k] = env[k])
  }
  function restore () {
    Object.keys(env).forEach(k => delete process.env[k])
    Object.keys(backup).forEach(k => process.env[k] = backup[k])
  }
  return { swap, restore }
}
