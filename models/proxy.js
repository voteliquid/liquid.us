const { combineEffects, preventDefault, redirect } = require('../helpers')
const { logAddedProxy } = require('../effects/analytics')

module.exports = (event, state) => {
  switch (event.type) {
    case 'pageLoaded':
      switch (state.location.route) {
        case '/proxies':
          if (!state.user) return [state, redirect('/sign_in')]
          return [{
            ...state,
            location: {
              ...state.location,
              title: 'Proxies',
            },
            loading: { ...state.loading, page: true, proxies: true },
          }, importEffect('fetchProxies', state.user)]
        default:
          return [state]
      }
    case 'proxy:addedProxyViaEmail':
      return [state, combineEffects([preventDefault(event.event), importEffect('addProxyViaEmail', event, state.proxies, state.user), logAddedProxy])]
    case 'proxy:addedProxyViaTwitter':
      return [state, combineEffects([preventDefault(event.event), importEffect('addProxyViaTwitter', event, state.proxies, state.user), logAddedProxy])]
    case 'proxy:addedProxyViaSearch':
      return [state, combineEffects([preventDefault(event.event), importEffect('addProxyViaSearch', event, state.proxies, state.user), logAddedProxy])]
    case 'proxy:addedProxyViaProfile':
      return [state, combineEffects([preventDefault(event.event), importEffect('addProxyViaProfile', event.profile, state.proxies, state.user), logAddedProxy])]
    case 'proxy:searched':
      return [{
        ...state,
        loading: { ...state.loading, proxySearch: true },
      }, combineEffects([preventDefault(event.event), importEffect('searchProxies', event, state.user)])]
    case 'proxy:removed':
      return [state, combineEffects([preventDefault(event.event), importEffect('removeProxy', event, state.cookies, state.proxies, state.user)])]
    case 'proxy:reordered':
      return [state, combineEffects([preventDefault(event.event), importEffect('reorderProxies', event, state.proxies, state.user)])]
    case 'proxy:searchResultsUpdated':
      return [{
        ...state,
        loading: { ...state.loading, proxySearch: false },
        proxySearchResults: event.results,
        proxySearchTerms: event.terms,
      }]
    case 'proxy:proxiesUpdated':
      return [{
        ...state,
        loading: { ...state.loading, page: false, proxies: false },
        proxies: event.proxies,
      }]
    default:
      return [state]
  }
}

const importEffect = (name, ...args) => (dispatch) => {
  return import('../effects/proxy').then((effects) => {
    return (effects.default || effects)[name].apply(null, args)(dispatch)
  })
}
