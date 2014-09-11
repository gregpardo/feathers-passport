var _ = require('lodash');

// See https://github.com/jfromaniello/passport.socketio/blob/master/lib/index.js

module.exports = function(settings) {
  var parser = settings.cookieParser(settings.secret);

  return function(req, next) {
    parser(req, {}, function(error) {
      if(error) {
        return next(error);
      }

      var cookie = !_.isEmpty(req.signedCookies) ? req.signedCookies : req.cookies;
      var sessionId = (req.query && req.query.session_id) ||
        (req._query && req._query.session_id) ||
        cookie[settings.key] || '';

      settings.store.get(sessionId, function(err, session){
        if(err) {
          return next(new Error('Error in session store:\n' + err.message));
        }

        if(!session) {
          return next(new Error('No session found'));
        }

        if(!session[settings.passport._key]) {
          return next(new Error('Passport was not initialized'));
        }

        var userKey = session[settings.passport._key][settings.userProperty];

        if(!userKey) {
          return next(new Error('User not settings.orized through passport. (User Property not found)'));
        }

        settings.passport.deserializeUser(userKey, function(err, user) {
          if (err) {
            return next(err);
          }

          if (!user) {
            return next(new Error("User not found"));
          }

          req[settings.userProperty] = user;

          next(null, user);
        });
      });
    });
  };
};
