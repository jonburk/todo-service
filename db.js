var config = require('config');
var mongo = require('mongodb').MongoClient;
var db = null;

// Open MongoDB connection
module.exports.connect = function() {
  mongo.connect(`mongodb://${config.get('App.db.host')}:${config.get('App.db.port')}/${config.get('App.db.name')}`, function (err, database) {
    if (err) return console.log(err);
    db = database;
  })
}

module.exports.get = function() {
  return db;
};