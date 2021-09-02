var config = require('config')
var AWS = require('aws-sdk')

function overrideOptionsFromAwsParameterStore(options, path, callback) {
  var ssm = new AWS.SSM()

  var ssmParams = {
    Path: path,
    WithDecryption: true
  }

  ssm.getParametersByPath(ssmParams, function (err, data) {
    if (err) {
      console.error('Error reading from parameter store')
      console.error(err)
      callback(options)
    }

    // Map parameter store keys to the options object
    var map = {
      mongoConnectionString: 'db.connectionString',
      securityEnabled: 'security.enabled',
      oauthClientId: 'security.oauth2.clientId',
      oauthClientSecret: 'security.oauth2.clientSecret',
      oauthCallbackUri: 'security.oauth2.callbackUri',
      sessionSecret: 'security.session.secret'
    }

    data.Parameters.forEach(function (parameter) {
      // Get the last part of the path (/TaskList/Prod/foo => foo)
      var parameterName = [parameter.Name.match(/([^\/]*)\/*$/)[1]]

      if (map.hasOwnProperty(parameterName)) {
        _.set(options, map[parameterName], parameter.Value)
      }
    })
  
    callback(options)
  })
}

function create(environment, callback) {
  console.log('Creating service options for ' + environment)  

  var options = {
    console: {
      enabled: config.get('App.console.enabled')
    },
    server: {
      listen: config.get('App.server.listen'),
      useCors: config.get('App.server.useCors')
    },
    swagger: {
      enabled = config.get('App.swagger.enabled')
    },
    db: {
      connectionString: config.get('App.db.connectionString')
    },
    security: {
      enabled: config.get('App.security.enabled'),
      oauth2: {
        clientId: config.get('App.security.oauth2.clientId'),
        clientSecret: config.get('App.security.oauth2.clientSecret'),
        callbackUri: config.get('App.security.oauth2.callbackUri')
      },
      session: {
        secret: config.get('App.security.session.secret')
      }
    }
  }

  var parameterStorePath = config.get('App.parameterStorePath')

  if (parameterStorePath) {
    overrideOptionsFromAwsParameterStore(options, parameterStorePath, callback)
  } else {
    callback(options)
  }
}

module.exports.create = create