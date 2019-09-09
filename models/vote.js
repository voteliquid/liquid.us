const {
  combineEffects, combineEffectsInSeries, preventDefault
} = require('../helpers')
const { fetchMeasure } = require('../effects/measure')
const { logEndorsed } = require('../effects/analytics')

module.exports = (event, state) => {
  switch (event.type) {
    case 'pageLoaded':
      switch (state.location.route) {
        case '/legislation/:shortId/votes/:voteId':
        case '/nominations/:shortId/votes/:voteId':
        case '/:username/:shortId/votes/:voteId':
          return [{
            ...state,
            loading: { ...state.loading, page: !state.votes[event.voteId] },
            votes: {
              ...state.votes,
              [event.voteId]: {
                ...state.votes[event.voteId],
                expanded: state.location.query.show_more === 'true',
              },
            },
          }, combineEffectsInSeries([
            importEffect('fetchVote', state.location.params.voteId, state.user),
            fetchMeasure(state.location.params.shortId, state),
          ])]
        default:
          return [state]
      }
    case 'vote:toggledExpanded':
      console.log(event.vote.id, state.votes)
      return [{
        ...state,
        votes: {
          ...state.votes,
          [event.vote.id]: {
            ...state.votes[event.vote.id],
            expanded: !state.votes[event.vote.id].expanded,
            endorsed_vote: state.votes[event.vote.id].endorsed_vote ? {
              ...state.votes[event.vote.id].endorsed_vote,
              expanded: !state.votes[event.vote.id].endorsed_vote.expanded,
            } : null,
          },
        },
      }, preventDefault(event.event)]
    case 'vote:reported':
      return [{
        ...state,
        votes: {
          [event.vote.id]: {
            ...state.votes[event.vote.id],
            reported: true,
          },
        },
      }, combineEffects([preventDefault(event.event), importEffect('reportVote', event.vote, state.user)])]
    case 'vote:endorsed':
      // TODO cannot change state here otherwise iframes in questions will re-render and Chrome will dismiss the confirm dialog whenever an iframe loads.
      return [state, combineEffectsInSeries([
        preventDefault(event.event),
        importEffect('endorse', event.vote, state.user, event.measure, event.is_public),
        typeof event.name !== 'undefined' && state.user && importEffect('updateNameAndAddressFromEndorsement', event, state.user),
        fetchMeasure(event.vote.measure.short_id, state),
        logEndorsed,
      ])]
    case 'vote:unendorsed':
      return [{
        ...state,
        loading: { ...state.loading, vote: true },
      }, combineEffectsInSeries([
        preventDefault(event.event),
        importEffect('unendorse', event.vote, state.user),
        fetchMeasure(event.vote.measure.short_id, state),
      ])]
    case 'vote:changedPrivacy':
      return [state, combineEffectsInSeries([
        preventDefault(event.event),
        importEffect('changeVotePrivacy', event.vote, event.public, state.user),
        fetchMeasure(event.vote.measure.short_id, state),
      ])]
    case 'vote:received':
    case 'vote:updated':
      if (!event.vote) {
        return [{ ...state, loading: { page: false }, location: { ...state.location, status: 404 } }]
      }
      return [{
        ...state,
        loading: { ...state.loading, vote: false },
        votes: {
          ...state.votes,
          [event.vote.id]: {
            ...state.votes[event.vote.id],
            ...event.vote,
          },
        },
        measures: {
          ...state.measures,
          [event.vote.measure.short_id]: {
            ...state.measures[event.vote.measure.short_id],
            vote: event.vote,
          },
        },
      }]
    case 'vote:voted':
      return [{
        ...state,
        loading: { ...state.loading, vote: true },
        user: state.user ? {
          ...state.user,
          last_vote_public: event.public,
        } : state.user,
      }, combineEffects([
        preventDefault(event.event),
        combineEffectsInSeries([
          importEffect('vote', event, state.user),
          fetchMeasure(event.measure.short_id, state),
        ])],
      )]
    default:
      return [state]
  }
}

const importEffect = (name, ...args) => (dispatch) => {
  return import('../effects/vote').then((voteEffects) => {
    return (voteEffects.default || voteEffects)[name].apply(null, args)(dispatch)
  })
}
