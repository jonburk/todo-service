var config = require('config')
var mongo = require('mongodb').MongoClient
var db = null

// Open MongoDB connection
module.exports.connect = function (callback) {
  mongo.connect(config.get('App.db.connectionString'), function (err, database) {
    db = database
    callback(err)
  })
}

module.exports.get = function () {
  return db
}
