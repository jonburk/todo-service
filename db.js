var mongo = require('mongodb').MongoClient;
var db = null;

// Open MongoDB connection
module.exports.connect = function() {
  mongo.connect('mongodb://localhost:27017/tasklist', function (err, database) {
    if (err) return console.log(err);
    db = database;
  })
}

module.exports.get = function() {
  return db;
};