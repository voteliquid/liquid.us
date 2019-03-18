const { api } = require('../helpers')

exports.fetchMetrics = (dispatch) => {
  return api(dispatch, '/metrics?select=users_count')
    .then((metrics) => dispatch({ type: 'metricsReceived', usersCount: metrics[0] ? metrics[0].users_count : 0 }))
    .catch(() => dispatch({ type: 'metricsReceived', usersCount: 0 }))
}
