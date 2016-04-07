
var receivedRequests = [];

module.exports = {
  receivedRequests: function () {
    return receivedRequests;
  },
  stub: {
    clear: function () {
      receivedRequests = [];
    }
  },
  repos: {
    getContent: function (req, f) {
      f('{}');
    }
  },
  issues: {
    getLabels: function (data, f) {
      f(null, [{name: 'status.toReview'}, {name: 'status.toMerge'}, {name: 'bug'}]);
    },
    edit: function (data, f) {
      receivedRequests.push(data);
      f(null, {});
    }
  }
}
