var config = require('config')

function createFromConfig(callback) {
  var options = {
    db: {
      connectionString: config.get('App.db.connectionString')
    },
    security: {
      enabled: config.get('App.security.enabled')
    }
  }

  if (options.security.enabled) {
    options.security.oauth2 = {
      clientId: config.get('App.security.oauth2.clientId'),
      clientSecret: config.get('App.security.oauth2.clientSecret'),
      callbackUri: config.get('App.security.oauth2.callbackUri')
    }

    options.security.session = {
      secret: config.get('App.security.session.secret')
    }
  }

  callback(options)
}

function createFromAwsParameterStore(callback) {
  callback({})
}

function create(environment, callback) {
  switch (environment) {
    case 'production':
      createFromAwsParameterStore(callback)
      break
    case 'cicd':
      options = createFromAwsParameterStore(callback)
      break      
    case 'test':
      options = createFromConfig(callback)
      break
    case 'development':
      options = createFromConfig(callback)
      break
    default:
      callback({})
      break
  }  
}

module.exports.create = create