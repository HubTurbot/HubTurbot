/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

var bl = require('bl');
var config = require('./config');
var express = require('express');
var fs = require('fs');
var mentionBot = require('./mention-bot.js');
var messageGenerator = require('./message.js');
var util = require('util');
var twss = require('twss');
twss.threshold = 0.9;

var GitHubApi = require('github');

var CONFIG_PATH = '.hubturbot';

if (!process.env.GITHUB_TOKEN) {
  console.error('The bot was started without a github account to post with.');
  console.error('To get started:');
  console.error('1) Create a new account for the bot');
  console.error('2) Settings > Personal access tokens > Generate new token');
  console.error('3) Only check `public_repo` and click Generate token');
  console.error('4) Run the following command:');
  console.error('GITHUB_TOKEN=insert_token_here npm start');
  console.error('5) Run the following command in another tab:');
  console.error('curl -X POST -d @__tests__/data/23.webhook http://localhost:5000/');
  console.error('6) Check that it commented here: https://github.com/fbsamples/bot-testing/pull/23');
  process.exit(1);
}

if (!process.env.GITHUB_USER) {
  console.warn(
    'There was no github user detected.',
    'This is fine, but mention-bot won\'t work with private repos.'
  );
  console.warn(
    'To make mention-bot work with private repos, please expose',
    'GITHUB_USER and GITHUB_PASSWORD as environment variables.',
    'The user and password must have access to the private repo',
    'you want to use.'
  );
}

var github = new GitHubApi({
  version: '3.0.0',
  host: config.github.apiHost,
  pathPrefix: config.github.pathPrefix,
  protocol: config.github.protocol,
  port: config.github.port
});

github.authenticate({
  type: 'oauth',
  token: process.env.GITHUB_TOKEN
});

var app = express();

function buildMentionSentence(reviewers) {

  if (!Array.isArray(reviewers)) {
    reviewers = [reviewers];
  }

  var atReviewers = reviewers.map(function(owner) { return '@' + owner; });

  if (reviewers.length === 1) {
    return atReviewers[0];
  }

  return (
    atReviewers.slice(0, atReviewers.length - 1).join(', ') +
    ' and ' + atReviewers[atReviewers.length - 1]
  );
}

function defaultMessageGenerator(reviewers) {
  return util.format(
    'By analyzing the blame information on this pull request' +
     ', we identified %s to be%s potential reviewer%s. Good luck!',
     buildMentionSentence(reviewers),
     reviewers.length > 1 ? '' : ' a',
     reviewers.length > 1 ? 's' : ''
  );
}

function getRepoConfig(request) {
  return new Promise(function(resolve, reject) {
    github.repos.getContent(request, function(err, result) {
      if(err) {
        reject(err);
      }
      resolve(result);
    });
  });
}

async function suggestReviewer(config, data) {

  var reviewers = await mentionBot.guessOwnersForPullRequest(
    data.repository.html_url, // 'https://github.com/fbsamples/bot-testing'
    data.pull_request.number, // 23
    data.pull_request.user.login, // 'mention-bot'
    data.pull_request.base.ref, // 'master'
    config,
    github
  );

  console.log(data.pull_request.html_url, reviewers);

  if (reviewers.length === 0) {
    console.log('Skipping because there are no reviewers found.');
    return;
  }

  github.issues.createComment({
    user: data.repository.owner.login, // 'fbsamples'
    repo: data.repository.name, // 'bot-testing'
    number: data.pull_request.number, // 23
    body: messageGenerator(
      reviewers,
      buildMentionSentence,
      defaultMessageGenerator
    )
  });
}

function promisify(f) {
  return function() {
    var args = Array.prototype.slice.call(arguments);
    return new Promise(function(resolve, reject) {
      return f.apply(null, args.concat([function(err, res) {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      }]));
    });
  };
}

function applyToReview(config, user, repo, number) {
  return promisify(github.issues.getIssueLabels)({
    user, repo, number
  }).then(function(res) {

    var labels = res.map(r => r.name);

    // Remove other prefixed labels
    var groupRegex = new RegExp('^' + config.statusPrefix);
    var newLabels = labels
      .filter(label => !groupRegex.test(label))
      .concat([config.statusPrefix + config.reviewLabel]);

    return promisify(github.issues.edit)({
      user, repo, number, labels: newLabels
    });
  }).catch(function(e) {
    console.log('Failed to change label', e, e.stack)
    if (e.code === 404) {
      console.log('Have you added HubTurbot as a collaborator to your repository?');
    }
  });
}

function createDefaultLabels(config, data) {

  var statusPrefix = config.statusPrefix;

  github.issues.createLabel({
    user: data.repository.owner.login,
    repo: data.repository.name,
    name: statusPrefix + "Discarded",
    color: "000000"
  });
  github.issues.createLabel({
    user: data.repository.owner.login,
    repo: data.repository.name,
    name: statusPrefix + "MergeApproved",
    color: "2A6E2F"
  });
  github.issues.createLabel({
    user: data.repository.owner.login,
    repo: data.repository.name,
    name: statusPrefix + "Ongoing",
    color: "6BC471"
  });
  github.issues.createLabel({
    user: data.repository.owner.login,
    repo: data.repository.name,
    name: statusPrefix + "OnHold",
    color: "E2F3E8"
  });
  github.issues.createLabel({
    user: data.repository.owner.login,
    repo: data.repository.name,
    name: statusPrefix + "ToDiscuss",
    color: "bfe5bf"
  });
  github.issues.createLabel({
    user: data.repository.owner.login,
    repo: data.repository.name,
    name: statusPrefix + "ToReview",
    color: "47B74E"
  });
  github.issues.createLabel({
    user: data.repository.owner.login,
    repo: data.repository.name,
    name: statusPrefix + "ToMerge",
    color: "38923D"
  });
}

async function handleIssueComment(config, data) {

  // HubTurbot will not reply to itself
  if (data.comment.user.login === "HubTurbot") {
    return;
  }

  if (/@HubTurbot create all labels please/.test(data.comment.body)) {
    console.log('Creating labels');
    createDefaultLabels(config, data);
    github.issues.createComment({
      user: data.repository.owner.login,
      repo: data.repository.name,
      number: data.issue.number,
      body: "All done!"
    });
  } else if (/ready (?:to|for) review/.test(data.comment.body)) {
    console.log('Applying toReview');
    return applyToReview(
      config,
      data.repository.owner.login,
      data.repository.name,
      data.issue.number);
  } else if (twss.is(data.comment.body)) {
    console.log('Posting a twss');
    github.issues.createComment({
      user: data.repository.owner.login,
      repo: data.repository.name,
      number: data.issue.number,
      body: "That's what she said!"
    });
  } else {
    console.log('Not responding to this comment');
  }
}

async function handlePRLabelChange(config, data) {

  if (data.sender.login === "HubTurbot")
    return;

  // Label added to PR
  if (data.action === "labeled") {
    if (data.label.name.toLowerCase().indexOf(config.reviewLabel.toLowerCase()) > 0) {
      if (data.pull_request.assignee) {
        console.log('Tagging reviewer');
        github.issues.createComment({
          user: data.repository.owner.login,
          repo: data.repository.name,
          number: data.pull_request.number,
          body: "Ready to review. " + buildMentionSentence(data.pull_request.assignee.login)
        });
      } else {
        console.log('Tagging team lead');
        github.issues.createComment({
          user: data.repository.owner.login,
          repo: data.repository.name,
          number: data.pull_request.number,
          body: "Ready to review, please assign a reviewer. " + buildMentionSentence(config.teamLead)
        });
      }
    } else if (data.label.name.toLowerCase().indexOf("critical") > 0) {
      console.log('Posting critical gif');
      github.issues.createComment({
        user: data.repository.owner.login,
        repo: data.repository.name,
        number: data.pull_request.number,
        body: "![Alt Text](https://media.giphy.com/media/AhjXalGPAfJg4/giphy.gif)"
      });
    }
  }

}

function handlePullRequest(config, data) {

  var actions = {
    opened: suggestReviewer,
    labeled: handlePRLabelChange
  };

  if (actions[data.action]) {
    return actions[data.action](config, data);
  }

  return Promise.resolve();
}

async function loadConfig(data) {

  var repoConfig = {
    maxReviewers: 3,
    numFilesToCheck: 5,
    userBlacklist: [],
    userBlacklistForPR: [],
    userWhitelist: [],
    fileBlacklist: [],
    requiredOrgs: [],
    findPotentialReviewers: true,

    teamLead: '',
    statusPrefix: 'status.',
    reviewLabel: 'toReview'
  };

  var user = data.repository.owner.login;
  var repo = data.repository.name;

  if (!(user && repo)) {
    console.log(util.format('Can\'t load config from %s/%s', user, repo));
    return repoConfig;
  }

  try {
    console.log(util.format('Getting config from %s/%s', user, repo));

    var configRes = await getRepoConfig({
      user, repo,
      path: CONFIG_PATH,
      headers: {
        Accept: 'application/vnd.github.v3.raw'
      }
    });

    repoConfig = {...repoConfig, ...JSON.parse(configRes)};
  } catch (e) {
    console.log('Failed to find or parse config file', e);
  }

  if (process.env.REQUIRED_ORG) {
    repoConfig.requiredOrgs.push(process.env.REQUIRED_ORG);
  }

  // TODO this won't work for all requests, since data.pull_requests sometimes will have no value

  // if (repoConfig.userBlacklistForPR.indexOf(data.pull_request.user.login) >= 0) {
  //   console.log('Skipping because blacklisted user ' +
  //     data.pull_request.user.login + 'created Pull Request.');
  //   return;
  // }

  return repoConfig;
}

async function work(body, req) {

  // console.log('\nbody: ' + body.toString());
  // console.log('\nheaders: ' + JSON.stringify(req.headers));

  var type = req.headers["x-github-event"];
  console.log('Event type:', type);

  var data = {};
  try {
    data = JSON.parse(body.toString());
  } catch (e) {
    console.error('Parse error in request body', e);
  }

  var config = await loadConfig(data);

  var actions = {
    pull_request: handlePullRequest,
    issue_comment: handleIssueComment
  };

  // Call event type handler
  if (!actions[type]) {
    console.log("Not handling action: " + data.action);
  } else {
    console.log("Handling action: " + data.action);
    await actions[type](config, data);
  }
};

app.post('/', function(req, res) {
  req.pipe(bl(function(err, body) {
    work(body, req)
      .then(() => res.end())
      .catch(e => {
        console.error('An error occurred:', e, e.stack);
        res.end();
      });
 }));
});

app.get('/', function(req, res) {
  res.send(
    'GitHub Mention Bot Active. ' +
    'Go to https://github.com/facebook/mention-bot for more information.'
  );
});

app.set('port', process.env.PORT || 5000);

app.listen(app.get('port'), function() {
  console.log('Listening on port', app.get('port'));
});
