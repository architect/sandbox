let {readArc} = require('@architect/utils')
let waterfall = require('run-waterfall')
let getAttributeDefinitions = require('./create-table/_get-attribute-definitions')
let getKeySchema = require('./create-table/_get-key-schema')
let clean = require('./create-table/_remove-ttl-and-lambda')
let createTable = require('./create-table')
let dynamo

module.exports = function init(callback) {
  // Don't load dynamo client with global requires, it may not yet have env vars loaded
  // eslint-disable-next-line
  dynamo = require('./_get-db-client')

  let {arc} = readArc()
  let app = arc.app[0]
  let plans = []

  // always create a fallback sessions table
  plans.push(function _createBackUpSessions(callback) {
    let attr = {_idx: '*String'}
    let keys = Object.keys(clean(attr))
    dynamo.createTable({
       TableName: 'arc-sessions',
       AttributeDefinitions: getAttributeDefinitions(attr),
       KeySchema: getKeySchema(attr, keys),
       ProvisionedThroughput: {
         ReadCapacityUnits: 5,
         WriteCapacityUnits: 5
       }
     },
     function _create() {
       // deliberately swallow the error: if it exists already thats ok (this is all in memory)
       callback()
     })
  })

  plans.push(function _createBackUpSessions(callback) {
    let attr = {_idx: '*String'}
    let keys = Object.keys(clean(attr))
    dynamo.createTable({
       TableName: `${app}-staging-arc-sessions`,
       AttributeDefinitions: getAttributeDefinitions(attr),
       KeySchema: getKeySchema(attr, keys),
       ProvisionedThroughput: {
         ReadCapacityUnits: 5,
         WriteCapacityUnits: 5
       }
     },
     function _create() {
       // deliberately swallow the error: if it exists already thats ok (this is all in memory)
       callback()
     })
  })

  plans.push(function _createBackUpSessions(callback) {
    let attr = {_idx: '*String'}
    let keys = Object.keys(clean(attr))
    dynamo.createTable({
       TableName: `${app}-production-arc-sessions`,
       AttributeDefinitions: getAttributeDefinitions(attr),
       KeySchema: getKeySchema(attr, keys),
       ProvisionedThroughput: {
         ReadCapacityUnits: 5,
         WriteCapacityUnits: 5
       }
     },
     function _create() {
       // deliberately swallow the error: if it exists already thats ok (this is all in memory)
       callback()
     })
  })

  if (arc.tables) {
    // kludge; pass ALL indexes into createTable to sort out
    let indexes = arc.indexes || []
    arc.tables.forEach(table=> {
      plans.push(function _createTable(callback) {
        createTable({
          table,
          app,
          indexes,
        }, callback)
      })
    })
  }
  waterfall(plans, function(err) {
    if (err) console.log(err)
    callback()
  })
}
