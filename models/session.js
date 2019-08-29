const atob = require('atob')
const { combineEffects, waitEffects, redirect, preventDefault } = require('../helpers')
const { refreshPageWhenAuthed } = require('../effects/page')
const { fetchMetrics } = require('../effects/metrics')

module.exports = (event, state) => {
  switch (event.type) {
    case 'session:error':
      return [{ ...state, error: event.error, loading: {} }]
    case 'session:signIn':
      return [{ ...state, loading: { ...state.loading, signIn: true } }, combineEffects([
        preventDefault(event.event),
        importEffect('signIn', { ...event }),
      ])]
    case 'session:signedOut':
      return [{ ...state, user: null }, importEffect('signOut', state.user)]
    case 'session:requestOTP':
      return [state, combineEffects([
        preventDefault(event.event),
        importEffect('requestOTP', event),
      ])]
    case 'session:verifyOTP':
      return [{ ...state, loading: { ...state.loading, signIn: true } }, combineEffects([
        preventDefault(event.event),
        importEffect('verifyOTP', event)],
      )]
    case 'pageLoaded':
      switch (state.location.route) {
        case '/join':
          if (state.user) {
            if (state.location.query.ph) {
              return [state, combineEffects([
                importEffect('updatePhoneNumber', atob(state.location.query.ph), state.user),
                redirect('/get_started')
              ])]
            }
            return [state, redirect('/')]
          }
          return [{
            ...state,
            loading: { ...state.loading, page: true },
            location: { ...state.location, title: 'Join' },
          }, waitEffects([
            fetchMetrics,
            state.cookies.proxying_user_id && importEffect('fetchProxyingProfile', { id: state.cookies.proxying_user_id }),
          ], { type: 'loaded', name: 'page' })]
        case '/sign_in':
          if (state.user) return [state, redirect('/')]
          return [{
            ...state,
            location: { ...state.location, title: 'Sign in' }
          }, state.cookies.proxying_user_id && importEffect('fetchProxyingProfile', { id: state.cookies.proxying_user_id })]
        case '/sign_in/verify':
          if (state.user) return [state, redirect('/')]
          if (state.location.query.totp) {
            return [{
              ...state,
              loading: { ...state.loading, page: true },
              location: { ...state.location, title: 'Sign in' },
            }, importEffect('verifyOTP', {
              totp: state.location.query.totp,
              device_id: state.cookies.device_id,
              device_desc: state.location.userAgent || 'Unknown',
              redirect_to: state.cookies.redirect_to || '/get_started',
            })]
          }
          return [{ ...state, location: { ...state.location, title: 'Sign in' } }, refreshPageWhenAuthed]
        case '/sign_out':
          return [{ ...state, loading: { page: true }, user: null }, importEffect('signOut', state.user)]
        default:
          return [state]
      }
    default:
      return [state]
  }
}

const importEffect = (name, ...args) => (dispatch) => {
  return import('../effects/session').then((effects) => {
    return (effects.default || effects)[name].apply(null, args)(dispatch)
  }).catch((error) => console.log(error))
}
