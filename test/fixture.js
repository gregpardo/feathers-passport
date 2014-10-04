var feathers = require('feathers');
var passport = require('passport');
var feathersPassport = require('../lib/passport');
var LocalStrategy = require('passport-local').Strategy;
var bodyParser = require('body-parser');

module.exports = function(expectedName, expectedPassword) {
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    done(null, {
      id: id
    });
  });

  passport.use(new LocalStrategy(
    function(username, password, done) {
      if(username === expectedName && password === expectedPassword) {
        return done(null, {
          id: username
        });
      }

      done(new Error('You are not authenticated!'));
    }
  ));

  var session = require('express-session');
  var store = new session.MemoryStore();

  var app = feathers()
    .configure(feathers.rest())
    .configure(feathers.socketio())
    .configure(feathersPassport({
      secret: 'feathers-rocks',
      store: store
    }))
    .use(bodyParser.urlencoded({ extended: true }))
    .use(function(req, res, next) {
      req.feathers.type = 'rest';
      next();
    })
    .use('/todos', {
      get: function(id, params, callback) {
        callback(null, {
          id: id,
          text: 'You have to do ' + id + '!',
          user: params.user
        });
      }
    })
    .post('/login', passport.authenticate('local', {
      successRedirect: '/',
      failureRedirect: '/login.html',
      failureFlash: false
    }))
    .use('/', feathers.static(__dirname));

  return app;
};
