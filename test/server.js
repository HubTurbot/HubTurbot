var request = require('supertest'),
  server = require('../server.js'),
  fs = require('fs'),
  github = require('../github-stubs.js'),
  expect = require('expect.js');

describe('Default response', function() {
  it('responds with default message', function(done) {
    request(server)
      .get('/')
      .expect('Content-Type', 'text/html; charset=utf-8')
      .expect('GitHub Mention Bot Active. Go to https://github.com/facebook/mention-bot for more information.')
      .expect(200, done);
  });
});

describe('Webhook comments', function() {
  beforeEach(function() {
    github.stub.clear();
  });
  webhookCommentTest('adds another fully-qualified exclusive label',
    'test/data/issue-comment-change-exclusive.webhook')
  webhookCommentTest('adds another partially-qualified exclusive label',
    'test/data/issue-comment-change-exclusive-partially-qualified.webhook')
});

function webhookCommentTest(desc, dataFile) {
  it(desc, function(done) {
    // Issue begins with status.toReview, status.toMerge added via comment
    request(server)
      .post('/')
      .send(fs.readFileSync(dataFile, 'utf-8'))
      .set('Content-Type', 'application/json')
      .set('x-github-event', 'issue_comment')
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);
        expect(github.receivedRequests()).to.eql([{
          user: 'dariusf',
          repo: 'issues',
          number: 66,
          labels: ['status.toMerge']
        }]);
        done();
      });
  });
}
