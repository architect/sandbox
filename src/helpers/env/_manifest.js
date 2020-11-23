module.exports = function printManifest ({ inventory, update }) {
  let { inv } = inventory
  // Read the current Architect project (or use a default project)
  if (!inv._project.manifest) {
    update.warn('No Architect project manifest found, using default project')
  }
  else {
    let file = inv._project.manifest.replace(process.cwd(), '').substr(1)
    update.done(`Found Architect project manifest: ${file}`)
  }
}
