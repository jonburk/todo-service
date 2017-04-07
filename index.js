'use strict';

var app = require('express')();
var passport = require('passport');
var config = require('config');
var serveStatic = require('serve-static');
var compression = require('compression');
var swaggerTools = require('swagger-tools');
var jsyaml = require('js-yaml');
var fs = require('fs');
var cors = require('cors');
var session = require('express-session');
var MongoDBStore = require('connect-mongodb-session')(session);
var db = require('./db');
var serverPort = process.env.PORT || config.get('App.server.port');

// Open MongoDB connection
db.connect();

module.exports.getDb = function() {
  return db;
};

// swaggerRouter configuration
var options = {
  swaggerUi: '/swagger.json',
  controllers: './controllers',
  useStubs: process.env.NODE_ENV === 'development' ? true : false // Conditionally turn on stubs (mock mode)
};

// The Swagger document (require it, build it programmatically, fetch it from a URL, ...)
var spec = fs.readFileSync('./api/swagger.yaml', 'utf8');
var swaggerDoc = jsyaml.safeLoad(spec);

if (process.env.NODE_ENV === 'development') {
  // Add cors
  app.use(cors());
}

if (process.env.NODE_ENV === 'production') {
  var store = new MongoDBStore({
    uri: config.get('App.db.connectionString'),
    collection: config.get('App.server.session.collection')
  });

  // Session
  var sessionConfig = {
    resave: false,
    saveUninitialized: false,
    secret: config.get('App.server.session.secret'),
    signed: true,
    store: store
  }

  app.use(session(sessionConfig));

  // Enable OAuth2
  app.use(passport.initialize());
  app.use(passport.session());

  var oauth = require('./oauth2');

  app.use(oauth.router);
  app.use(oauth.required);
}

// Compression
app.use(compression());

// Static readFileSync
app.use(serveStatic('./static', {'index': ['index.html']}));

// Initialize the Swagger middleware
swaggerTools.initializeMiddleware(swaggerDoc, function (middleware) {
  // Interpret Swagger resources and attach metadata to request - must be first in swagger-tools middleware chain
  app.use(middleware.swaggerMetadata());

  // Validate Swagger requests
  app.use(middleware.swaggerValidator());

  // Route validated requests to appropriate controller
  app.use(middleware.swaggerRouter(options));

  if (process.env.NODE_ENV === 'development') {
    // Serve the Swagger documents and Swagger UI  
    app.use(middleware.swaggerUi());
  }

  // Start the server
  app.listen(serverPort, function() {
    console.log(`App listening on port ${serverPort}`);
  })
});
