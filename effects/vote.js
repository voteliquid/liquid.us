const { api, makePoint, possessive } = require('../helpers')
const { updateNameAndAddress } = require('../effects/user')
const { signIn } = require('../effects/session')
const { fetchMeasure } = require('../effects/measure')

exports.vote = ({ event, measure, ...form }, user) => (dispatch) => {
  if (!form.position) {
    return dispatch({ type: 'error', error: new Error('You must choose a position.') })
  }

  if (!user) {
    dispatch({ type: 'cookieSet', key: 'vote_bill_id', value: measure.id })
    dispatch({ type: 'cookieSet', key: 'vote_bill_short_id', value: measure.short_id })
    dispatch({ type: 'cookieSet', key: 'vote_position', value: form.position })
    dispatch({ type: 'cookieSet', key: 'vote_public', value: form.public ? 'true' : '' })
    dispatch({ type: 'cookieSet', key: 'vote_comment', value: form.comment })

    return dispatch({ type: 'redirected', url: '/join' })
  }

  return api(dispatch, `/votes?user_id=eq.${user.id}&measure_id=eq.${measure.id}`, {
    method: measure.vote ? 'PATCH' : 'POST',
    body: JSON.stringify({
      user_id: user.id,
      measure_id: measure.id,
      position: form.position,
      root_delegate_id: user.id,
      delegate_rank: -1,
      delegate_id: null,
      delegate_name: null,
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

exports.reportVote = (vote, user) => (dispatch) => {
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

const endorse = exports.endorse = (vote, user, measure, is_public = false) => (dispatch) => {
  const endorsed_vote = !(user && user.id === vote.user_id && vote.comment) && vote.endorsed_vote
  const { fullname, measure_id, short_id, id: vote_id } = endorsed_vote || vote
  const position = measure && measure.vote && measure.vote.position

  if (!user) {
    dispatch({ type: 'cookieSet', key: 'endorsed_vote_id', value: vote_id })
    dispatch({ type: 'cookieSet', key: 'endorsed_measure_id', value: measure_id })
    dispatch({ type: 'cookieSet', key: 'endorsed_url', value: `/legislation/${short_id}/votes/${vote_id}` })
    return dispatch({ type: 'redirected', url: '/join' })
  }

  if (position) {
    let confirmation_text = 'You\'ve already '
    if (measure.vote && measure.vote.position) {
      confirmation_text += `commented. This will remove your previous comment`
    } else {
      confirmation_text += `voted ${position}`
    }
    confirmation_text += `. Endorse ${fullname ? possessive(fullname) : 'this'} vote instead?`
    if (!window.confirm(confirmation_text)) {
      return
    }
  }

  return api(dispatch, `/endorsements?user_id=eq.${user.id}&measure_id=eq.${measure_id}`, {
    method: position && measure.endorsed ? 'PATCH' : 'POST',
    body: JSON.stringify({
      user_id: user.id,
      vote_id,
      measure_id,
      public: is_public,
    }),
    user,
  })
  .then(() => api(dispatch, `/votes_detailed?id=eq.${vote.id}`, { user }))
  .then(([vote]) => dispatch({ type: 'vote:updated', vote }))
  .catch((error) => {
    if (error.code === 23505) {
      return api(dispatch, `/endorsements?user_id=eq.${user.id}&measure_id=eq.${measure_id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          user_id: user.id,
          vote_id,
          measure_id,
          public: is_public,
        }),
        user,
      })
      .then(() => api(dispatch, `/votes_detailed?id=eq.${vote.id}`, { user }))
      .then(([vote]) => dispatch({ type: 'vote:updated', vote }))
      .catch((error) => dispatch({ type: 'error', error }))
    }
    dispatch({ type: 'error', error })
  })
}

exports.unendorse = (vote, user) => (dispatch) => {
  if (!user) {
    return dispatch({ type: 'redirected', url: '/join' })
  }
  if (!window.confirm(`Are you sure you want to remove this endorsement?`)) {
    return
  }
  return api(dispatch, `/votes_detailed?user_id=eq.${user.id}&measure_id=eq.${vote.measure_id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      position: 'abstain',
      delegate_rank: -1,
      root_delegate_id: user.id,
      delegate_id: null,
    }),
    user,
  })
  .then(() => api(dispatch, `/votes_detailed?id=eq.${vote.id}`, { user }))
  .then(([vote]) => dispatch({ type: 'vote:updated', vote }))
  .catch((error) => dispatch({ type: 'error', error }))
}

exports.changeVotePrivacy = (vote, is_public, user) => (dispatch) => {
  const endorsed_vote = !(user && user.id === vote.user_id && vote.comment) && vote.endorsed_vote
  const { measure_id, id: vote_id } = endorsed_vote || vote

  return api(dispatch, `/endorsements?user_id=eq.${user.id}&measure_id=eq.${measure_id}`, {
    method: 'PATCH',
    body: JSON.stringify({ user_id: user.id, vote_id, measure_id, public: is_public }),
    user,
  })
  .then(() => api(dispatch, `/votes_detailed?measure_id=eq.${measure_id}&id=eq.${vote_id}`, { user }))
  .then(([vote]) => dispatch({ type: 'vote:updated', vote }))
  .catch((error) => dispatch({ type: 'error', error }))
}

exports.fetchVote = (id, user) => (dispatch) => {
  return api(dispatch, `/votes_detailed?id=eq.${id}`, { user })
    .then(([vote]) => dispatch({ type: 'vote:received', vote }))
    .catch((error) => dispatch({ type: 'error', error }))
}

const validateNameAndAddressForm = (address, name) => {
  const name_pieces = name.split(' ')

  if (name_pieces.length < 2) {
    return Object.assign(new Error('Please enter a first and last name'), { field: 'name' })
  } else if (name_pieces.length > 5) {
    return Object.assign(new Error('Please enter only a first and last name'), { field: 'name' })
  }

  if (!address.match(/ \d{5}/) && (!window.lastSelectedGooglePlacesAddress || !window.lastSelectedGooglePlacesAddress.lon)) {
    return Object.assign(
      new Error(`Please use your complete address including city, state, and zip code.`),
      { field: 'address' }
    )
  }
}

exports.updateNameAndAddressFromEndorsement = (form, user) => (dispatch) => {
  const { address, voter_status } = form
  const error = validateNameAndAddressForm(address, form.name)

  if (error) return dispatch({ type: 'error', error })

  const name_pieces = form.name.split(' ')
  const first_name = name_pieces[0]
  const last_name = name_pieces.slice(1).join(' ')

  return updateNameAndAddress({
    addressData: {
      address,
      locality: window.lastSelectedGooglePlacesAddress.locality,
      administrative_area_level_1: window.lastSelectedGooglePlacesAddress.administrative_area_level_1,
      administrative_area_level_2: window.lastSelectedGooglePlacesAddress.administrative_area_level_2,
      postal_code: window.lastSelectedGooglePlacesAddress.postal_code,
      country: window.lastSelectedGooglePlacesAddress.country,
      geocoords: makePoint(window.lastSelectedGooglePlacesAddress.lon, window.lastSelectedGooglePlacesAddress.lat),
    },
    nameData: { first_name, last_name, voter_status },
    user,
  })(dispatch)
}

exports.signupAndEndorse = ({ vote, ...form }, state) => (dispatch) => {
  const { location } = state
  const { address, email, voter_status } = form
  const error = validateNameAndAddressForm(address, form.name)

  if (error) return dispatch({ type: 'error', error })

  const name_pieces = form.name.split(' ')
  const first_name = name_pieces[0]
  const last_name = name_pieces.slice(1).join(' ')

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
          locality: window.lastSelectedGooglePlacesAddress.locality,
          administrative_area_level_1: window.lastSelectedGooglePlacesAddress.administrative_area_level_1,
          administrative_area_level_2: window.lastSelectedGooglePlacesAddress.administrative_area_level_2,
          postal_code: window.lastSelectedGooglePlacesAddress.postal_code,
          country: window.lastSelectedGooglePlacesAddress.country,
          geocoords: makePoint(window.lastSelectedGooglePlacesAddress.lon, window.lastSelectedGooglePlacesAddress.lat),
        },
        nameData: { first_name, last_name, voter_status },
        user,
      })(dispatch)
        .then(() => endorse(vote, user, null, form.is_public)(dispatch))
        .then(() => fetchMeasure(vote.measure.short_id, state)(dispatch))
    }
  })
}
