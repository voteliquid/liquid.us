const { ASSETS_URL } = process.env
const stateNames = require('datasets-us-states-abbr-names')
const { api, avatarURL, combineEffects, combineEffectsInSeries, escapeHtml, makePoint, possessive, preventDefault } = require('../helpers')
const { fetchMeasure, fetchMeasureVotes } = require('../effects/measure')
const { updateNameAndAddress } = require('../effects/user')
const { signIn } = require('../effects/session')
const { changePageTitle } = require('../effects/page')

module.exports = (event, state) => {
  switch (event.type) {
    case 'pageLoaded':
      switch (state.location.route) {
        case '/legislation/:shortId/votes/:voteId':
        case '/nominations/:shortId/votes/:voteId':
        case '/:username/legislation/:shortId/votes/:voteId':
          return [{
            ...state,
            loading: { ...state.loading, page: true },
          }, combineEffectsInSeries([
            fetchMeasure(state.location.params.shortId, state.offices, state.user),
            fetchVoteReplies(state.location.params.voteId, state.user),
            fetchVote(state.location.params.voteId, state.user),
          ])]
        default:
          return [state]
      }
    case 'vote:toggledMobileEndorsementForm':
      return [{
        ...state,
        votes: {
          ...state.votes,
          [event.vote.id]: {
            ...state.votes[event.vote.id],
            showMobileEndorsementForm: !state.votes[event.vote.id].showMobileEndorsementForm,
          },
        },
      }, preventDefault(event.event)]
    case 'vote:toggledExpanded':
      return [{
        ...state,
        votes: {
          ...state.votes,
          [event.vote.id]: {
            ...state.votes[event.vote.id],
            expanded: !state.votes[event.vote.id].expanded,
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
      }, combineEffects([preventDefault(event.event), reportVote(event.vote, state.user)])]
    case 'vote:endorsed':
      // TODO cannot change state here otherwise iframes in comments will re-render and Chrome will dismiss the confirm dialog whenever an iframe loads.
      return [state, combineEffectsInSeries([
        preventDefault(event.event),
        endorse(event.vote, state.user, event.measure, event.is_public),
        typeof event.name !== 'undefined' && state.user && updateNameAndAddressFromEndorsement(event, state.user),
        fetchMeasure(event.vote.short_id, state.offices, state.user),
        fetchMeasureVotes(event.vote.short_id, state.location.query.order, state.location.query.position, state.user),
      ])]
    case 'vote:endorsedFromSignupForm':
      return [{
        ...state,
        loading: { ...state.loading, vote: true, endorsedFromSignupForm: true },
      }, combineEffectsInSeries([
        preventDefault(event.event),
        signupAndEndorse(event, state.offices, state.location),
      ])]
    case 'vote:unendorsed':
      return [{
        ...state,
        loading: { ...state.loading, vote: true },
      }, combineEffectsInSeries([
        preventDefault(event.event),
        unendorse(event.vote, state.user),
        fetchMeasure(event.vote.short_id, state.offices, state.user),
        fetchMeasureVotes(event.vote.short_id, state.location.query.order, state.location.query.position, state.user),
      ])]
    case 'vote:changedPrivacy':
      return [state, combineEffectsInSeries([
        preventDefault(event.event),
        changeVotePrivacy(event.vote, event.public, state.user),
        fetchMeasure(event.vote.short_id, state.offices, state.user),
        fetchMeasureVotes(event.vote.short_id, state.location.query.order, state.location.query.position, state.user),
      ])]
    case 'vote:toggledRepsMessage':
      return [{
        ...state,
        votes: {
          ...state.votes,
          [event.vote.id]: {
            ...state.votes[event.vote.id],
            notYourRepsMessageVisible: !state.votes[event.vote.id].notYourRepsMessageVisible,
          },
        },
      }, preventDefault(event.event)]
    case 'vote:received':
      if (!event.vote) {
        return [{ ...state, loading: { page: false }, location: { ...state.location, status: 404 } }]
      }
      const endorsementLocation = endorsementPageTitleAndMeta(state.measures, event.vote, state.location)
      return [{
        ...state,
        loading: { ...state.loading, page: false, vote: false },
        location: endorsementLocation,
        votes: {
          ...state.votes,
          [event.vote.id]: {
            ...state.votes[event.vote.id],
            ...event.vote,
          },
        },
      }, changePageTitle(endorsementLocation.title)]
    case 'vote:updated':
      return [{
        ...state,
        loading: { ...state.loading, vote: false, endorsedFromSignupForm: false },
        votes: {
          ...state.votes,
          [event.vote.id]: {
            ...state.votes[event.vote.id],
            ...event.vote,
          },
        },
      }]
    case 'vote:replied':
      return [{
        ...state,
        loading: { ...state.loading, reply: true },
      }, combineEffects([preventDefault(event.event), reply(event, state.user)])]
    case 'vote:repliesReceived':
      return [{
        ...state,
        loading: { ...state.loading, reply: false },
        votes: {
          ...state.votes,
          [event.voteId]: {
            ...state.votes[event.voteId],
            replies: event.replies,
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
      }, combineEffectsInSeries([
        vote(event, state.user),
        fetchMeasure(event.measure.short_id, state.offices, state.user),
        fetchMeasureVotes(event.measure.short_id, state.location.query.order, state.location.query.position, state.user),
      ])]
    default:
      return [state]
  }
}

const vote = ({ event, measure, ...form }, user) => (dispatch) => {
  if (event) event.preventDefault()

  if (!form.vote_position) {
    return dispatch({ type: 'error', error: new Error('You must choose a position.') })
  }

  if (!user) {
    dispatch({ type: 'cookieSet', key: 'vote_bill_id', value: measure.id })
    dispatch({ type: 'cookieSet', key: 'vote_bill_short_id', value: measure.short_id })
    dispatch({ type: 'cookieSet', key: 'vote_position', value: form.vote_position })
    dispatch({ type: 'cookieSet', key: 'vote_public', value: form.public ? 'true' : '' })
    dispatch({ type: 'cookieSet', key: 'vote_comment', value: form.comment })

    return dispatch({ type: 'redirected', url: '/join' })
  }

  return api(dispatch, '/rpc/vote', {
    method: 'POST',
    body: JSON.stringify({
      user_id: user.id,
      measure_id: measure.id,
      vote_position: form.vote_position,
      comment: form.comment || null,
      public: form.public,
    }),
    user,
  })
  .then(() => {
    dispatch({ type: 'measure:voteFormToggled', measure })
    return api(dispatch, `/votes_detailed?user_id=eq.${user.id}&measure_id=eq.${measure.id}`, { user })
  })
  .then(([vote]) => dispatch({ type: 'vote:updated', vote }))
  .catch((error) => dispatch({ type: 'error', error }))
}

const reportVote = (vote, user) => (dispatch) => {
  if (!vote.reported) {
    return api(dispatch, '/reports', {
      method: 'POST',
      body: JSON.stringify({
        reporter_id: user.id,
        comment_author_id: vote.user_id,
        comment_id: vote.id,
        explanation: null,
      }),
      user,
    })
    .catch((error) => dispatch({ type: 'error', error }))
  }
}

const endorse = (vote, user, measure, is_public = false) => (dispatch) => {
  const endorsed_vote = !(user && user.id === vote.user_id && vote.comment) && vote.endorsed_vote
  const { fullname, measure_id, short_id, id: vote_id } = endorsed_vote || vote
  const position = measure && measure.vote_position

  if (!user) {
    dispatch({ type: 'cookieSet', key: 'endorsed_vote_id', value: vote_id })
    dispatch({ type: 'cookieSet', key: 'endorsed_measure_id', value: measure_id })
    dispatch({ type: 'cookieSet', key: 'endorsed_url', value: `/legislation/${short_id}/votes/${vote_id}` })
    return dispatch({ type: 'redirected', url: '/join' })
  }

  if (position) {
    let confirmation_text = 'You\'ve already '
    if (measure.endorsed) {
      confirmation_text += `endorsed ${possessive(measure.endorsement.fullname)} ${position} argument`
    } else if (measure.vote_position) {
      confirmation_text += `commented. This will remove your previous comment`
    } else {
      confirmation_text += `voted ${position}`
    }
    confirmation_text += `. Endorse ${fullname ? possessive(fullname) : 'this'} vote instead?`
    if (!window.confirm(confirmation_text)) {
      return
    }
  }

  return api(dispatch, '/rpc/endorse', {
    method: 'POST',
    body: JSON.stringify({ user_id: user.id, vote_id, measure_id, public: is_public }),
    user,
  })
  .then(() => api(dispatch, `/votes_detailed?id=eq.${vote.id}`, { user }))
  .then(([vote]) => dispatch({ type: 'vote:updated', vote }))
  .catch((error) => dispatch({ type: 'error', error }))
}

const unendorse = (vote, user) => (dispatch) => {
  if (!user) {
    return dispatch({ type: 'redirected', url: '/join' })
  }
  if (!window.confirm(`Are you sure you want to remove this endorsement?`)) {
    return
  }
  const endorsed_vote = !(user && user.id === vote.user_id && vote.comment) && vote.endorsed_vote
  const { id: vote_id } = endorsed_vote || vote
  return api(dispatch, '/rpc/unendorse', {
    method: 'POST',
    body: JSON.stringify({ vote_id }),
    user,
  })
  .then(() => api(dispatch, `/votes_detailed?id=eq.${vote.id}`, { user }))
  .then(([vote]) => dispatch({ type: 'vote:updated', vote }))
  .catch((error) => dispatch({ type: 'error', error }))
}

const changeVotePrivacy = (vote, is_public, user) => (dispatch) => {
  const endorsed_vote = !(user && user.id === vote.user_id && vote.comment) && vote.endorsed_vote
  const { measure_id, id: vote_id } = endorsed_vote || vote

  return api(dispatch, '/rpc/endorse', {
    method: 'POST',
    body: JSON.stringify({ user_id: user.id, vote_id, measure_id, public: is_public }),
    user,
  })
  .then(() => api(dispatch, `/votes_detailed?measure_id=eq.${measure_id}&id=eq.${vote_id}`, { user }))
  .then(([vote]) => dispatch({ type: 'vote:updated', vote }))
  .catch((error) => dispatch({ type: 'error', error }))
}

const fetchVote = (id, user) => (dispatch) => {
  return api(dispatch, `/votes_detailed?id=eq.${id}`, { user })
    .then(([vote]) => dispatch({ type: 'vote:received', vote }))
    .catch((error) => dispatch({ type: 'error', error }))
}

const fetchVoteReplies = (voteId, user) => (dispatch) => {
  return api(dispatch, `/replies_detailed?vote_id=eq.${voteId}&order=created_at.desc`, { user })
    .then((replies) => dispatch({ type: 'vote:repliesReceived', voteId, replies }))
    .catch((error) => dispatch({ type: 'error', error }))
}

const reply = ({ vote, content }, user) => (dispatch) => {
  const reply = {
    vote_id: vote.id,
    user_id: user.id,
    content,
  }

  api(dispatch, `/replies`, {
    method: 'POST',
    body: JSON.stringify(reply),
    user,
  })
  .then(() => api(dispatch, `/replies_detailed?vote_id=eq.${vote.id}&order=created_at.desc`, { user }))
  .then((replies) => dispatch({ type: 'vote:repliesReceived', voteId: vote.id, replies }))
}

const updateNameAndAddressFromEndorsement = (form, user) => (dispatch) => {
  const { address, voter_status } = form

  const name_pieces = form.name.split(' ')
  const first_name = name_pieces[0]
  const last_name = name_pieces.slice(1).join(' ')

  if (name_pieces.length < 2) {
    return dispatch({ type: 'error', error: Object.assign(new Error('Please enter a first and last name'), { name: true }) })
  } else if (name_pieces.length > 5) {
    return dispatch({ type: 'error', error: Object.assign(new Error('Please enter only a first and last name'), { name: true }) })
  }

  return updateNameAndAddress({
    addressData: {
      address,
      city: window.lastSelectedGooglePlacesAddress.city,
      state: window.lastSelectedGooglePlacesAddress.state,
      geocoords: makePoint(window.lastSelectedGooglePlacesAddress.lon, window.lastSelectedGooglePlacesAddress.lat),
    },
    nameData: { first_name, last_name, voter_status },
    user,
  })(dispatch)
}

const signupAndEndorse = ({ vote, ...form }, offices, location) => (dispatch) => {
  const { address, email, voter_status } = form

  const name_pieces = form.name.split(' ')
  const first_name = name_pieces[0]
  const last_name = name_pieces.slice(1).join(' ')

  if (name_pieces.length < 2) {
    return dispatch({ type: 'error', error: Object.assign(new Error('Please enter a first and last name'), { name: true }) })
  } else if (name_pieces.length > 5) {
    return dispatch({ type: 'error', error: Object.assign(new Error('Please enter only a first and last name'), { name: true }) })
  }

  return signIn({
    channel: 'endorsement',
    email,
    device_desc: location.userAgent || 'Unknown',
    phone_number: null,
    redirect_to: location.path,
  })(dispatch).then((user) => {
    if (user) {
      return updateNameAndAddress({
        addressData: {
          address,
          city: window.lastSelectedGooglePlacesAddress.city,
          state: window.lastSelectedGooglePlacesAddress.state,
          geocoords: makePoint(window.lastSelectedGooglePlacesAddress.lon, window.lastSelectedGooglePlacesAddress.lat),
        },
        nameData: { first_name, last_name, voter_status },
        user,
      })(dispatch)
        .then(() => endorse(vote, user, null, form.is_public)(dispatch))
        .then(() => fetchMeasure(vote.short_id, offices, user)(dispatch))
        .then(() => fetchMeasureVotes(vote.short_id, location.query.order, location.query.position, user)(dispatch))
    }
  })
}

const endorsementPageTitleAndMeta = (measures, vote, location) => {
  const measure = measures[vote.short_id]
  const isCity = measure.legislature_name.includes(',')
  const anonymousName = `${measure.legislature_name === 'U.S. Congress' ? 'American' : (stateNames[measure.legislature_name] || measure.legislature_name)} Resident`

  const firstRealSentence = escapeHtml(vote.comment, { replaceApos: false, stripImages: true })
    .split('\n').filter(line => line)[0] // strip leading whitespace
  const title = `${vote.fullname || anonymousName}: ${firstRealSentence}`

  const inlineImageMatch = vote && vote.comment.match(/\bhttps?:\/\/\S+\.(png|jpg|jpeg|gif)\b/i)
  const inlineImage = inlineImageMatch && inlineImageMatch[0]
  const authorImage = vote.username || vote.twitter_username ? avatarURL(vote) : null
  const measureImage = (!isCity) ? `${ASSETS_URL}/legislature-images/${measure.legislature_name}.png` : ''

  return {
    ...location,
    ogImage: inlineImage || authorImage || measureImage,
    ogTitle: `${measure.title} | Liquid US`,
    description: title,
    title,
  }
}
