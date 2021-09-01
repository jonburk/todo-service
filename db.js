var mongo = require('mongodb').MongoClient
var db = null

// Open MongoDB connection
module.exports.connect = function (connectionString, callback) {
  mongo.connect(connectionString, function (err, client) {
    db = client ? client.db() : null

    callback(err)
  })
}

module.exports.get = function () {
  return db
}
