let plugin = {
  sandbox: {
    start: async function ({ invoke }) {
      plugin.invoke = invoke
    }
  }
}
module.exports = plugin
