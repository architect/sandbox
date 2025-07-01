let { extname, join } = require('path')
let { existsSync } = require('fs')
let series = require('run-series')
let { callbackify } = require('util')
let getDBClient = require('../tables/_get-db-client')
let { loadFileWithoutExtension } = require('../lib/load-file')

module.exports = function startupSeedData (params, callback) {
  let { ARC_ENV } = process.env
  let { creds, cwd, inventory, update, ports } = params
  let { inv, get } = inventory
  let { app, tables } = inv
  if (!tables || ARC_ENV !== 'testing') return callback()

  // Seed files: sandbox-seed.[m|c]js[on], or custom
  let { preferences: prefs } = inventory.inv._project
  let seedFilePref = prefs?.sandbox?.['seed-data'] && join(cwd, prefs.sandbox['seed-data'])
  let file
  if (seedFilePref && existsSync(seedFilePref)) {
    file = seedFilePref.replace(`.${extname(seedFilePref)}`, '')
  }
  else {
    file = join(cwd, 'sandbox-seed')
  }
  callbackify(loadFileWithoutExtension)(file, (err, data) => {
    if (err) return callback(new Error(`Failed to load seed data from ${file}: ${err.message}`, { cause: err }))
    if (!data) return callback()

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
      return rows.map(Item => callback => {
        dynamo.PutItem({ TableName, Item })
          .then(result => callback(null, result))
          .catch(callback)
      })
    }).filter(Boolean)

    getDBClient({ creds, inventory, ports }, (err, aws) => {
      if (err) callback(err)
      else {
        dynamo = aws.DynamoDB
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
  })
}
