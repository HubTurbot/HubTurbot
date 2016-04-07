
var requests = [];

module.exports = {
  stub: {
    clear: function () {
      requests = [];
    }
  },
  issues: {
    getAllLabels: function (user, repo) {
      return [];
    },
    setLabels: function (user, repo, number, labels) {
      requests.push({
        type: 'setLabels', user, repo, number, labels
      });
    }
  }
}
