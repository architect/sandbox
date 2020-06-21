let readArc = require('../sandbox/read-arc')
let series = require('run-series')
let getAttributeDefinitions = require('./create-table/_get-attribute-definitions')
let getKeySchema = require('./create-table/_get-key-schema')
let clean = require('./create-table/_remove-ttl-and-lambda')
let createTable = require('./create-table')
let getDBClient = require('./_get-db-client')

module.exports = function init (callback) {
  getDBClient(function _gotDBClient (err, dynamo) {
    if (err) console.log(err) // Yes, but actually no 🏴‍☠️

    let { arc } = readArc()
    let app = arc.app[0]

    function createSessionTable ({ attr, TableName }) {
      return function (callback) {
        let keys = Object.keys(clean(attr))
        dynamo.createTable({
          TableName,
          AttributeDefinitions: getAttributeDefinitions(attr),
          KeySchema: getKeySchema(attr, keys),
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
          }
        },
        function _create () {
          // deliberately swallow errors: it's ok if tables already exist, this is all in-memory
          callback()
        })
      }
    }

    /**
     * Session table mocks (jic)
     */
    // Staging and production sessions
    let stagingSessions = createSessionTable({
      attr: { _idx: '*String' },
      TableName: `${app}-staging-arc-sessions`,
    })
    let productionSessions = createSessionTable({
      attr: { _idx: '*String' },
      TableName: `${app}-production-arc-sessions`,
    })
    // Legacy sessions table
    let fallBackSessions = createSessionTable({
      attr: { _idx: '*String' },
      TableName: 'arc-sessions'
    })

    let plans = [
      fallBackSessions,
      stagingSessions,
      productionSessions
    ]

    if (arc.tables) {
      // kludge; pass ALL indexes into createTable to sort out
      let indexes = arc.indexes || []
      arc.tables.forEach(table => {
        plans.push(function _createTable (callback) {
          createTable({
            app,
            dynamo,
            indexes,
            table,
          }, callback)
        })
      })
    }

    series(plans, function (err) {
      if (err) console.log(err)
      callback()
    })
  })
}
