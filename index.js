'use strict'

var app = require('express')()
var passport = require('passport')
var config = require('config')
var serveStatic = require('serve-static')
var compression = require('compression')
var swaggerTools = require('swagger-tools')
var jsyaml = require('js-yaml')
var fs = require('fs')
var cors = require('cors')
var session = require('express-session')
var MongoDBStore = require('connect-mongodb-session')(session)
var db = require('./db')
var serviceOptions = require('./serviceOptions')
var serverPort = process.env.TODO_SERVICE_PORT || 8080

function createServer (options, callback) {
  // Open MongoDB connection
  db.connect(options.db.connectionString, function (err) {
    if (err) {
      if (options.console.enabled) {
        console.error(err)
      }

      if (callback) {
        callback()
      }

      return
    }

    // Health check for load balancer
    app.get('/healthcheck', function (req, res) {
      res.send('Healthy')
    })

    // The Swagger document (require it, build it programmatically, fetch it from a URL, ...)
    var spec = fs.readFileSync('./api/swagger.yaml', 'utf8')
    var swaggerDoc = jsyaml.safeLoad(spec)

    if (options.server.useCors) {
      // Add cors
      app.use(cors())
    }

    if (options.security.enabled) {
      var store = new MongoDBStore({
        uri: options.db.connectionString,
        collection: 'sessions'
      })

      // Session
      var sessionConfig = {
        resave: false,
        saveUninitialized: false,
        secret: options.security.session.secret,
        signed: true,
        store: store
      }

      app.use(session(sessionConfig))

      // Enable OAuth2
      app.use(passport.initialize())
      app.use(passport.session())

      var oauth = require('./oauth2')
      oauth.init(options.security.oauth2.clientId, options.security.oauth2.clientSecret, options.security.oauth2.callbackUri)

      app.use(oauth.router)
      app.use(oauth.required)
    }

    // Compression
    app.use(compression())

    // Static readFileSync
    app.use(serveStatic('./static', {'index': ['index.html']}))

    // Initialize the Swagger middleware
    swaggerTools.initializeMiddleware(swaggerDoc, function (middleware) {
      // Interpret Swagger resources and attach metadata to request - must be first in swagger-tools middleware chain
      app.use(middleware.swaggerMetadata())

      // Validate Swagger requests
      app.use(middleware.swaggerValidator())

      // Route validated requests to appropriate controller
      app.use(middleware.swaggerRouter({
        swaggerUi: '/swagger.json',
        controllers: './controllers',
        useStubs: options.swagger.enabled
      }))

      if (options.swagger.enabled) {
        // Serve the Swagger documents and Swagger UI
        app.use(middleware.swaggerUi())
      }

      // Start the server
      app.listen(serverPort, function () {
        if (options.console.enabled) {
          console.log(`App listening on port ${serverPort}`)
        }

        if (callback) callback(app)
      })
    })
  })
}

if (config.get('App.server.listen')) {
  serviceOptions.create(function(options) {
    createServer(options)
  })
}

module.exports.createServer = createServer
