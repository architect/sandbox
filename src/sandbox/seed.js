let { extname, join } = require('path')
let { existsSync, readFileSync } = require('fs')
let series = require('run-series')
let getDBClient = require('../tables/_get-db-client')

module.exports = function startupSeedData (params, callback) {
  let { ARC_ENV } = process.env
  let { cwd, inventory, update, ports } = params
  let { inv, get } = inventory
  let { app, tables } = inv
  if (!tables || ARC_ENV !== 'testing') return callback()

  // Seed files: seed-data.json, seed-data.js, or custom
  let { preferences: prefs } = inventory.inv._project
  let seedFile = prefs?.sandbox?.['seed-data'] && join(cwd, prefs.sandbox['seed-data'])
  let seedJson = join(cwd, 'sandbox-seed.json')
  let seedJs = join(cwd, 'sandbox-seed.js')

  let file
  /**/ if (existsSync(seedFile)) file = seedFile
  else if (existsSync(seedJson)) file = seedJson
  else if (existsSync(seedJs))   file = seedJs

  if (file) {
    let ext = extname(file).replace('.', '')
    if (![ 'json', 'js' ].includes(ext)) {
      return callback(ReferenceError('Seed data file must be valid .json or .js'))
    }
    let data
    try {
      if (ext === 'json') data = JSON.parse(readFileSync(file))
      // eslint-disable-next-line
      else data = require(file)
    }
    catch (err) {
      return callback(Error(`Failed to load seed data from ${file}`))
    }

    let dynamo
    let seeds = Object.entries(data).flatMap(([ table, rows ]) => {
      if (!get.tables(table)) {
        update.warning(`Unable to seed data to @tables '${table}', table not found`)
        return
      }
      if (!Array.isArray(rows)) {
        update.warning(`Unable to seed data to @tables '${table}', each table must have an array of rows`)
        return
      }
      let TableName = `${app}-staging-${table}`
      return rows.map(Item => callback => dynamo.put({ TableName, Item }, callback))
    }).filter(Boolean)

    getDBClient(ports, (err, db, doc) => {
      if (err) callback(err)
      else {
        dynamo = doc
        let start = Date.now()
        series(seeds, (err) => {
          if (err) callback(err)
          else {
            let rel = file.replace(cwd, '').substr(1)
            let plural = arr => arr.length === 1 ? '' : 's'
            update.done(`Seeded ${Object.keys(data).length} table${plural(tables)} with ${seeds.length} row${plural(seeds)} from ${rel} in ${Date.now() - start}ms`)
            callback()
          }
        })
      }
    })
  }
  else callback()
}
