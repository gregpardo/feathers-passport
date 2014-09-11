var _ = require('lodash');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var passport = require('passport');

var authorization = require('./authorizer');
var getSettings = function(settings) {
  var result = _.extend({
    store: new session.MemoryStore(),
    cookieParser: cookieParser,
    passport: passport,
    key: 'connect.sid'
  }, settings);

  if(!result.session) {
    result.session = session(settings);
  }

  result.userProperty = result.passport._userProperty || 'user';

  return result;
};

module.exports = function(configuration) {
  if(!configuration.secret) {
    throw new Error('Session secret must be provided!');
  }

  var settings = getSettings(configuration);
  var authorizer = authorization(settings);

  return function() {
    var app = this;
    var oldSetup = app.setup;

    app.use(settings.cookieParser(settings.secret))
      .use(settings.session)
      .use(settings.passport.initialize())
      .use(settings.passport.session())
      .use(function(req, res, next) {
        // Make the Passport user also available for services
        req.feathers.user = req.user;
        next();
      });

    app.setup = function() {
      var result = oldSetup.apply(this, arguments);
      var io = app.io;
      var primus = app.primus;

//      passport.serializeUser(function(user, done) {
//        done(null, user.name);
//      });
//
//      passport.deserializeUser(function(id, done) {
//        done(null, {
//          name: id
//        });
//      });

      if(io) {
        io.use(function(socket, next) {
          authorizer(socket.request, function(error, user) {
            if(error) {
              return next(error);
            }

            socket.feathers.user = user;
            next();
          });
        });
      }

      if(primus) {
        primus.authorize(function(req, done) {
          authorizer(req, function(error, user) {
            if(error) {
              return done(error);
            }

            req.feathers.user = user;
            done();
          });
        });
      }

      return result;
    }
  }
};
