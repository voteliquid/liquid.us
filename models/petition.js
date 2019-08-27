const { api, combineEffects, combineEffectsInSeries, makePoint, preventDefault } = require('../helpers')
const { fetchMeasure } = require('../effects/measure')
const { updateNameAndAddress } = require('../effects/user')
const { signIn } = require('../effects/session')

module.exports = (event, state) => {
  switch (event.type) {
    case 'petition:signatureToggledPrivacyCheckbox':
      return [{
        ...state,
        measures: {
          ...state.measures,
          [event.measure.short_id]: {
            ...state.measures[event.measure.short_id],
            vote_public: event.event.currentTarget.checked,
          },
        },
      }]
    case 'petition:toggledRepsMessage':
      return [{
        ...state,
        measures: {
          ...state.votes,
          [event.measure.short_id]: {
            ...state.measures[event.measure.short_id],
            notYourRepsMessageVisible: !state.measures[event.measure.short_id].notYourRepsMessageVisible,
          },
        },
      }, preventDefault(event.event)]
    case 'petition:toggledMobileEndorsementForm':
      return [{
        ...state,
        measures: {
          ...state.votes,
          [event.measure.short_id]: {
            ...state.measures[event.measure.short_id],
            showMobileEndorsementForm: !state.measures[event.measure.short_id].showMobileEndorsementForm,
          },
        },
      }, preventDefault(event.event)]
    case 'petition:signatureFormSubmitted':
    case 'petition:commentFormSubmitted':
      return [{
        ...state,
        loading: { ...state.loading, form: true },
        user: state.user ? {
          ...state.user,
          last_vote_public: event.public,
        } : state.user,
      }, combineEffectsInSeries([
        preventDefault(event.event),
        sign(event, state.user, event.comment),
        fetchMeasure(event.measure.short_id, state),
      ])]
    case 'petition:signatureSignupFormSubmitted':
      return [{
        ...state,
        loading: { ...state.loading, form: true },
        user: state.user ? {
          ...state.user,
          last_vote_public: event.public,
        } : state.user,
      }, combineEffects([
        preventDefault(event.event),
        signupAndSign(event, state),
      ])]
    default:
      return [state]
  }
}

const sign = ({ measure, ...form }, user, comment) => (dispatch) => {
  return api(dispatch, `/votes?user_id=eq.${user.id}&measure_id=eq.${measure.id}`, {
    method: measure.vote ? 'PATCH' : 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      user_id: user.id,
      measure_id: measure.id,
      position: 'yea',
      root_delegate_id: user.id,
      delegate_rank: -1,
      delegate_id: null,
      delegate_name: null,
      public: form.is_public,
      comment,
    }),
    user,
  })
  .then(() => api(dispatch, `/votes_detailed?user_id=eq.${user.id}&measure_id=eq.${measure.id}`, { user }))
  .then(([vote]) => dispatch({ type: 'vote:updated', vote }))
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

const signupAndSign = (form, state) => (dispatch) => {
  const { location } = state
  const { address, email, voter_status } = form
  const error = validateNameAndAddressForm(address || '', form.name)

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
        .then(() => sign(form, user)(dispatch))
        .then(() => fetchMeasure(form.measure.short_id, state)(dispatch))
    }
  })
}
