var assert = require('assert');
var request = require('request').defaults({ jar: true });
var createApplication = require('./fixture');

describe('REST API authentication', function() {
  var server;

  before(function(done) {
    server = createApplication('rester', 'testing').listen(8888);
    server.on('listening', done);
  });

  after(function(done) {
    server.close(done);
  });

  it('logs in', function(done) {
    request({
      url: 'http://localhost:8888/login',
      method: 'POST',
      form: {
        username: 'rester',
        password: 'testing'
      }
    }, function(err, res, body) {
      assert.equal(res.statusCode, 302, 'Got redirect');
      assert.ok(body.indexOf('login.html') === -1, 'Not redirected back to login');
      done();
    });
  });

  it('requesting Todos returns the logged in user', function(done) {
    request({
      url: 'http://localhost:8888/login',
      method: 'POST',
      form: {
        username: 'rester',
        password: 'testing'
      }
    }, function(err, res, body) {
      assert.equal(res.statusCode, 302, 'Got redirect');
      assert.ok(body.indexOf('login.html') === -1, 'Not redirected back to login');
      request({
        url: 'http://localhost:8888/todos/dishes',
        json: true
      }, function(err, res, body) {
        assert.deepEqual(body, {
          id: 'dishes',
          text: 'You have to do dishes!',
          user: { id: 'rester' }
        });
        done();
      });
    });
  });
});
