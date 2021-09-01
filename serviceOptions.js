var config = require('config')
var AWS = require('aws-sdk')

function createFromConfig(callback) {  
  // Reshape the config settings to match the results from the AWS param store
  var rawOptions = {
    mongoConnectionString: config.get('App.db.connectionString'),
    securityEnabled: config.get('App.security.enabled')
  }

  if (rawOptions.securityEnabled) {
    rawOptions.oauthCallbackUri = config.get('App.security.oauth2.callbackUri')
    rawOptions.oauthClientId = config.get('App.security.oauth2.clientId')
    rawOptions.oauthClientSecret = config.get('App.security.oauth2.clientSecret')
    rawOptions.sessionSecret = config.get('App.security.session.secret')
  }

  formatOptions(rawOptions, callback)
}

function createFromAwsParameterStore(path, securityEnabled, callback) {
  AWS.config.update({region:'us-east-2'})
  var ssm = new AWS.SSM()

  var params = {
    Path: path,
    WithDecryption: true
  }

  ssm.getParametersByPath(params, function (err, data) {
    if (err) {
      console.error('Error reading from parameter store')
      console.error(err)
      callback({})
    }

    var rawOptions = {
      securityEnabled: securityEnabled
    }

    data.Parameters.forEach(function (param) {
      // Get the last part of the path (/TaskList/Prod/foo => foo)
      rawOptions[param.Name.match(/([^\/]*)\/*$/)[1]] = param.Value
    })

    formatOptions(rawOptions, callback)
  })
}

function formatOptions(rawOptions, callback) {  
  var options = {
    db: {
      connectionString: rawOptions.mongoConnectionString
    },
    security: {
      enabled: rawOptions.securityEnabled
    }
  }

  if (options.security.enabled) {
    options.security.oauth2 = {
      clientId: rawOptions.oauthClientId,
      clientSecret: rawOptions.oauthClientSecret,
      callbackUri: rawOptions.oauthCallbackUri
    }

    options.security.session = {
      secret: rawOptions.sessionSecret
    }
  }

  callback(options)
}

function create(environment, callback) {
  console.log('Creating service options for ' + environment)

  switch (environment) {
    case 'production':
      createFromAwsParameterStore('/TaskList/Prod/', true, callback)
      break
    case 'cicd':
      createFromAwsParameterStore('/TaskList/CICD/', false, callback)
      break      
    case 'test':
      createFromConfig(callback)
      break
    case 'development':
      createFromConfig(callback)
      break
    default:
      callback({})
      break
  }  
}

module.exports.create = create