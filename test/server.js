var request = require('supertest'),
  server = require('../server.js');

describe('GET /', function() {
  it('responds with default message', function(done) {
    request(server)
      .get('/')
      .expect('Content-Type', 'text/html; charset=utf-8')
      .expect('GitHub Mention Bot Active. Go to https://github.com/facebook/mention-bot for more information.')
      .expect(200, done);
  });
});
