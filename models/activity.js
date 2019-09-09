const { api } = require('../helpers')

module.exports = (event, state) => {
  switch (event.type) {
    case 'pageLoaded':
      switch (state.location.route) {
        case '/activity':
          return [{
            ...state,
            loading: {
              ...state.loading,
              activity: true,
              page: typeof window !== 'object',
            },
          }, fetchActivity(state)]
        default:
          return [state]
      }
    case 'activity:received':
      return [{
        ...state,
        actions: event.actions.map((action) => {
          if (action.action === 'vote-inherited') {
            return { ...action, resource: action.resource_id }
          }
          return action
        }),
        loading: { ...state.loading, activity: false, page: false },
        votes: event.actions.filter(({ action }) => action === 'vote-inherited').reduce((votes, action) => {
          votes[action.resource_id] = { ...votes[action.resource_id], ...action.resource }
          return votes
        }, state.votes),
      }]
    default:
      return [state]
  }
}

const fetchActivity = (state) => (dispatch) => {
  const { legislatures, location, user } = state
  const legislature = location.query.legislature && `&legislature_id=eq.${location.query.legislature}`
  const allLegislatures = legislatures.length && `&legislature_id=in.(${legislatures.map(({ id }) => id).join(',')})`
  return api(dispatch, `/actions_detailed?resource=not.is.null${legislature || allLegislatures || ''}&order=occurred_at.desc&limit=25`, {
    user,
  }).then((actions) => {
    dispatch({ type: 'activity:received', actions })
  })
}
