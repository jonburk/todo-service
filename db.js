var config = require('config');
var mongo = require('mongodb').MongoClient;
var db = null;

module.exports.getConnectionString = function () {
  var username = config.get('App.db.username');
  var password = config.get('App.db.password');
  var credentials = '';

  if (username) {
    credentials = `[${username}:${password}@]`;
  }

  return `mongodb://${credentials}${config.get('App.db.host')}:${config.get('App.db.port')}/${config.get('App.db.name')}`;
}

// Open MongoDB connection
module.exports.connect = function() {
  mongo.connect(this.getConnectionString(), function (err, database) {
    if (err) return console.log(err);
    db = database;
  })
}

module.exports.get = function() {
  return db;
};