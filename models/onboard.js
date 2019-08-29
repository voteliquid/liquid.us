const { combineEffects, preventDefault, redirect } = require('../helpers')
const { logPublicProfileCreated } = require('../effects/analytics')

module.exports = (event, state) => {
  switch (event.type) {
    case 'pageLoaded':
      switch (state.location.route) {
        case '/get_started':
          return [{
            ...state,
            loading: {
              ...state.loading,
              page: true,
            },
          }, importEffect('redirectToOnboardingStep', state.cookies, state.location.query, state.user)]
        case '/get_started/basics':
          if (!state.user) return [state, redirect('/sign_in')]
          return [state]
        case '/get_started/verification':
          if (!state.user) return [state, redirect('/sign_in?notification=verify')]
          if (state.user && (!state.user.first_name || !state.user.last_name)) {
            return [state, redirect('/get_started/basics')]
          }
          return [state]
        case '/get_started/profile':
          if (!state.user) return [state, redirect('/sign_in')]
          if (!state.user.phone_verified) return [state, redirect('/get_started/verification')]
          return [state, state.user.username && redirect(`/${state.user.username}`)]
        default:
          return [state]
      }
    case 'onboard:savedBasicInfo':
      return [{
        ...state,
        loading: { ...state.loading, user: true },
      }, combineEffects([
        preventDefault(event.event),
        importEffect('saveBasicInfo', event, state.cookies, state.user),
      ])]
    case 'onboard:requestedVerificationCode':
      return [{
        ...state,
        error: null,
        loading: { ...state.loading, verification: true },
        forms: { ...state.forms, verification: { ...state.forms.verification, ...event } },
      }, combineEffects([
        preventDefault(event.event),
        importEffect('requestOTP', event, state.user),
      ])]
    case 'onboard:enteredVerificationCode':
      return [{
        ...state,
        error: null,
        loading: { ...state.loading, verification: true },
      }, combineEffects([
        preventDefault(event.event),
        importEffect('verifyOTP', event, state.user),
      ])]
    case 'onboard:toggledVerificationCodeForm':
      return [{
        ...state,
        error: null,
        loading: { ...state.loading, verification: false },
        forms: {
          ...state.forms,
          verification: {
            ...state.forms.verification,
            showVerifyCodeForm: !(state.forms.verification || {}).showVerifyCodeForm
          },
        },
      }, preventDefault(event.event)]
    case 'onboard:savedUsername':
      return [state, combineEffects([
        preventDefault(event.event),
        importEffect('saveUsername', event, state.user),
        logPublicProfileCreated()
      ])]
    default:
      return [state]
  }
}

const importEffect = (name, ...args) => (dispatch) => {
  return import('../effects/onboard').then((effects) => {
    return (effects.default || effects)[name].apply(null, args)(dispatch)
  })
}
