const { combineEffects, combineEffectsInSeries, preventDefault } = require('../helpers')
const { fetchMeasure } = require('../effects/measure')

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
        importEffect('sign', event, state.user, event.comment),
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
        importEffect('signupAndSign', event, state),
      ])]
    default:
      return [state]
  }
}

const importEffect = (name, ...args) => (dispatch) => {
  return import('../effects/petition').then((effects) => {
    return (effects.default || effects)[name].apply(null, args)(dispatch)
  })
}
