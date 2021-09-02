'use strict'

var express = require('express')
var passport = require('passport')
var GoogleStrategy = require('passport-google-oauth20').Strategy
var db = require('./db')
var _ = require('lodash')
var router = express.Router()

function extractProfile (profile) {
  return {
    id: profile.id,
    displayName: profile.displayName
  }
}

function init (clientId, clientSecret, callbackUri) {
  passport.use(new GoogleStrategy({
    clientID: clientId,
    clientSecret: clientSecret,
    callbackURL: callbackUri
  }, (accessToken, refreshToken, profile, cb) => {
    db.get().collection('users').findOne({ googleId: profile.id }, function (err, result) {
      var authErr = null
      var extractedProfile = null
  
      if (err) {
        authErr = err
      } else if (_.isEmpty(result)) {
        db.get().collection('unknownUsers').insert(profile)
        authErr = 'Unknown user'
      } else {
        extractedProfile = extractProfile(profile)
      }
  
      cb(authErr, extractedProfile)
    })
  }))
  
  passport.serializeUser((user, cb) => {
    cb(null, user)
  })
  
  passport.deserializeUser((obj, cb) => {
    cb(null, obj)
  })  
  
  router.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }))
  
  router.get('/auth/google/callback', passport.authenticate('google'), function (req, res, next) {
    res.redirect('/')
  })  
}

function authRequired (req, res, next) {
  if (!req.user) {
    return res.redirect('/auth/google')
  }
  next()
}

module.exports = {
  router: router,
  required: authRequired,
  init: init
}
