var config = require('config')
var mongo = require('mongodb').MongoClient
var db = null

// Open MongoDB connection
module.exports.connect = function (callback) {
  mongo.connect(config.get('App.db.connectionString'), function (err, database) {
    if (err) return console.log(err)
    db = database
    callback()
  })
}

module.exports.get = function () {
  return db
}
