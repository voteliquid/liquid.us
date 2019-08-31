const { api, combineEffects } = require('../helpers')

module.exports = (event, state) => {
  switch (event.type) {
    case 'metric:requested':
      return [{
        ...state,
        loading: {
          ...state.loading,
          metrics: {
            users: true,
            active_users: true,
            votes: true,
            proposals: true,
          },
        },
      }, combineEffects([
        fetchMetrics('users'),
        fetchMetrics('active_users'),
        fetchMetrics('votes'),
        fetchMetrics('proposals'),
      ])]
    case 'metric:received':
      return [{
        ...state,
        loading: {
          ...state.loading,
          page: false,
          metrics: {
            ...state.loading.metrics,
            [event.name]: false,
          },
        },
        metrics: {
          ...state.metrics,
          [event.name]: event.metrics,
        },
      }]
    case 'pageLoaded':
      switch (state.location.route) {
        case '/metrics':
          return [{
            ...state,
            location: {
              ...state.location,
              title: 'Metrics',
              noindex: true,
            },
          }]
        default:
          return [state]
      }
    default:
      return [state]
  }
}

const fetchMetrics = (name) => (dispatch) => {
  return api(dispatch, `/metric_${name}?order=week.desc`).then((metrics) => {
    if (name === 'votes') {
      metrics = metrics.filter(({ week }) => week.slice(0, 10) !== '2018-12-28')
    }
    dispatch({
      type: 'metric:received',
      name,
      metrics: metrics.reverse(),
    })
  })
}
