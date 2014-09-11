var feathers = require('feathers');
var passport = require('passport');
var feathersPassport = require('../lib/passport');
var LocalStrategy = require('passport-local').Strategy;

passport.serializeUser(function(user, done) {
  done(null, user.name);
});

passport.deserializeUser(function(id, done) {
  done(null, {
    name: id
  });
});

passport.use(new LocalStrategy(
  function(username, password, done) {
    if(username === 'david' && password === 'test') {
      console.log('Authentication successful')
      return done(null, {
        name: 'david'
      });
    }

    done(new Error('You are not authenticated!'));
  }
));

var app = feathers()
  .configure(feathers.rest())
  .configure(feathers.socketio())
  .configure(feathersPassport({
    secret: 'feathers-rocks',
    passport: passport
  }))
  .use('/users', {
    get: function(id, params, callback) {
      console.log(params.user);

      callback(null, {
        id: id,
        text: 'You have to do ' + id + '!'
      });
    }
  })
  .post('/login', passport.authenticate('local', {
      successRedirect: '/',
      failureRedirect: '/login.html',
      failureFlash: false
  }))
  .use('/', feathers.static(__dirname));

app.listen(4000);
