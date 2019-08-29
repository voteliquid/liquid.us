const { combineEffects, preventDefault, redirect } = require('../helpers')
const { changePageTitle } = require('../effects/page')

module.exports = (event, state) => {
  switch (event.type) {
    case 'pageLoaded':
      switch (state.location.route) {
        case '/edit_profile':
          if (!state.user) return [state, redirect('/sign_in')]
          return [{
            ...state,
            location: { ...state.location, title: 'Edit Profile' },
          }]
        case '/:username':
          return [{
            ...state,
            loading: { ...state.loading, page: true },
          }, importEffect('fetchProfile', { ...state.location.params, ...state.location.query }, state.cookies, state.user)]
        case '/twitter/:username':
          return [{
            ...state,
            loading: { ...state.loading, page: true },
          }, importEffect('fetchProfile', { ...state.location.params, twitter: true, ...state.location.query }, state.cookies, state.user)]
        default:
          return [state]
      }
    case 'profile:userProfileErrorSaving':
      return [state]
    case 'profile:userProfileSaved':
      return [{
        ...state,
        user: { ...state.user, about: event.about, intro_video_url: event.intro_video_url }
      }, combineEffects([
        preventDefault(event.event),
        importEffect('saveProfile', event),
      ])]
    case 'profile:userProfileFormChanged':
      return [{ ...state, forms: { ...state.forms, profile: event } }]
    case 'profile:updated':
      return [{
        ...state,
        profiles: {
          ...state.profiles,
          [(event.profile.username || event.profile.twitter_username || '').toLowerCase()]: {
            ...state.profiles[(event.profile.username || event.profile.twitter_username || '').toLowerCase()],
            ...event.profile,
          },
        },
      }]
    case 'profile:received':
      if (!event.profile) {
        return [{
          ...state,
          loading: { ...state.loading, page: false },
          location: { ...state.location, status: 404 },
        }]
      }
      return [{
        ...state,
        loading: { ...state.loading, page: false },
        location: {
          ...state.location,
          ...event.location,
        },
        profiles: {
          ...state.profiles,
          [(event.profile.username || event.profile.twitter_username || '').toLowerCase()]: {
            ...state.profiles[(event.profile.username || event.profile.twitter_username || '').toLowerCase()],
            ...event.profile,
            public_votes: (event.profile.public_votes || []).map((vote) => vote.id),
          },
        },
        votes: (event.profile.public_votes || []).reduce((votes, vote) => {
          votes[vote.id] = vote
          return votes
        }, state.votes),
      }, combineEffects([
        changePageTitle((event.location && event.location.title) || state.location.title),
        event.profile.username && importEffect('fetchProposedMeasureCount', event.profile.id, event.profile.username.toLowerCase()),
      ])]
    case 'profile:proposedMeasureCountUpdated':
      return [{
        ...state,
        profiles: {
          ...state.profiles,
          [event.username]: {
            ...state.profiles[event.username],
            proposedMeasureCount: event.proposedMeasureCount,
          },
        },
      }]
    default:
      return [state]
  }
}

const importEffect = (name, ...args) => (dispatch) => {
  return import('../effects/profile').then((effects) => {
    return (effects.default || effects)[name].apply(null, args)(dispatch)
  })
}
