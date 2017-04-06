'use strict'

var express = require('express');
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var config = require('config');

function extractProfile (profile) {
  return {
    id: profile.id,
    displayName: profile.displayName,
  };
}

passport.use(new GoogleStrategy({
  clientID: config.get('App.security.oauth2.clientId'),
  clientSecret: config.get('App.security.oauth2.clientSecret'),
  callbackURL: config.get('App.security.oauth2.callback')
}, (accessToken, refreshToken, profile, cb) => {
  cb(null, extractProfile(profile));
}));

passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((obj, cb) => {
  cb(null, obj);
}); 

var router = express.Router();

router.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }));

router.get('/auth/google/callback', passport.authenticate('google'), function(req, res, next) {
  res.redirect('/');
});

function authRequired (req, res, next) {
  if (!req.user) {
    return res.redirect('/auth/google');
  }
  next();
}

module.exports = {
  extractProfile: extractProfile,
  router: router,
  required: authRequired
};