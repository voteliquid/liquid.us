const { api, avatarURL, combineEffects, redirect } = require('../helpers')
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
          }, fetchProfile({ ...state.location.params, ...state.location.query }, state.cookies, state.user)]
        case '/twitter/:username':
          return [{
            ...state,
            loading: { ...state.loading, page: true },
          }, fetchProfile({ ...state.location.params, twitter: true, ...state.location.query }, state.cookies, state.user)]
        default:
          return [state]
      }
    case 'profile:userProfileErrorSaving':
      return [state]
    case 'profile:userProfileSaved':
      return [{
        ...state,
        user: { ...state.user, about: event.about, intro_video_url: event.intro_video_url }
      }, saveProfile(event)]
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
        event.profile.username && fetchProposedMeasureCount(event.profile.id, event.profile.username.toLowerCase()),
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

const saveProfile = ({ event, about, intro_video_url, user }) => (dispatch) => {
  if (event) event.preventDefault()

  return api(dispatch, `/users?select=id&id=eq.${user.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ about, intro_video_url }),
    user,
  })
  .catch((error) => {
    if (~error.message.indexOf('users_intro_video_url_check')) {
      error.message = 'Invalid intro video URL. Enter the share URL (example: https://youtu.be/XMrRrzYXav8)'
    }
    dispatch({ type: 'profile:userProfileErrorSaving', error })
  })
}

const fetchProfile = ({ id, username, twitter, ...params }, cookies, user) => (dispatch) => {
  const url = username
    ? `/user_profiles?${twitter ? 'twitter_username' : 'username'}=eq.${username}`
    : `/user_profiles?id=eq.${id}`

  return api(dispatch, url, { user }).then(([profile]) => {
    if (!profile) {
      return dispatch({ type: 'profile:received', profile: null })
    }

    const officeUrl = `/legislature_offices?select=name,short_name,chamber,legislature_id,code&office_holder_id=eq.${profile.id}`

    return api(dispatch, officeUrl, { user }).then((offices) => {
      if (offices && offices[0]) {
        profile.office = offices[0]
      }

      if (profile.twitter_username && !profile.username) {
        profile.name = profile.twitter_displayname
      }

      return Promise.all([
        fetchMaxVotePower(profile, dispatch),
        fetchPublicVotes(profile, user, dispatch),
        fetchLegislatorGrade(profile, user, dispatch),
        fetchLegislatorVotes(params, profile, user, dispatch),
        fetchIsProxyingToProfile(profile, user, dispatch),
        fetchProxiedNameIfOwnProfile(cookies, user, dispatch),
      ])
      .then(([max_vote_power, public_votes, grade, votes, proxied, proxied_name]) => {
        dispatch({
          type: 'profile:received',
          location: {
            title: profile.name,
            description: `Empower ${profile.first_name} to represent you in our legislatures.`,
            ogImage: avatarURL(profile),
          },
          profile: {
            ...profile,
            grade,
            max_vote_power,
            proxied,
            proxied_name,
            public_votes,
            votes,
          },
        })
      })
    })
  })
  .catch((error) => dispatch({ type: 'error', error }))
}

const fetchMaxVotePower = (profile, dispatch) => {
  if (profile) {
    return api(dispatch, `/rpc/max_vote_power`, {
      method: 'POST',
      body: JSON.stringify({ user_id: profile.id, since: new Date('1970').toISOString() }),
    })
  }
}

const fetchIsProxyingToProfile = (profile, user, dispatch) => {
  if (profile && user) { // If logged in, check if already proxying
    return api(dispatch, `/delegations?from_id=eq.${user.id}&to_id=eq.${profile.id}`, { user })
      .then((proxies) => !!proxies[0])
  }
}

const fetchPublicVotes = (profile, user, dispatch) => {
  if (profile && !profile.office) {
    return api(dispatch, `/votes_detailed?user_id=eq.${profile.id}&order=created_at.desc&limit=25`, { user })
  }
}

const fetchLegislatorGrade = (profile, user, dispatch) => {
  if (profile && profile.office) {
    return api(dispatch, `/legislator_grades?user_id=eq.${profile.id}&order=calculated_at.desc&limit=1`, { user })
      .then(([grade]) => grade)
  }
}

const fetchLegislatorVotes = (params, profile, user, dispatch) => {
  if (profile && profile.office) {
    const page_size = 20
    const page = Number(params.page || 1)

    const range_start = (page * page_size) - page_size
    const range_end = (page * page_size) - 1
    const order = (sort = 'desc') => ({
      date: `rollcall_occurred_at.${sort}.nullslast`,
      with_constituents: `with_constituents.${sort}.nullslast,rollcall_occurred_at.desc.nullslast`,
      against_constituents: `against_constituents.${sort}.nullslast,rollcall_occurred_at.desc.nullslast`,
      representation_delta: `representation_delta.${sort}.nullslast,rollcall_occurred_at.desc.nullslast`,
    })

    return api(dispatch, `/legislator_votes?legislator_user_id=eq.${profile.id}&order=${order(params.order)[params.order_by || 'date']}`, {
      headers: {
        'Range-Unit': 'items',
        'Range': `${range_start}-${range_end}`,
      },
      user,
    })
  }
}

const fetchProxiedNameIfOwnProfile = (cookies, user, dispatch) => {
  const proxied_user_id = cookies.proxied_user_id

  if (proxied_user_id) {
    dispatch({ type: 'cookieUnset', key: 'proxied_user_id' })

    return api(dispatch, `/user_profiles?select=id,first_name,last_name&id=eq.${proxied_user_id}`, { user }).then(users => {
      if (users[0]) return `${users[0].first_name} ${users[0].last_name}`
    })
  }
}

const fetchProposedMeasureCount = (userId, username) => (dispatch) => {
  return api(dispatch, `/measures_detailed?select=author_id&author_id=eq.${userId}`)
    .then(measures => dispatch({ type: 'profile:proposedMeasureCountUpdated', proposedMeasureCount: measures.length, username }))
}
