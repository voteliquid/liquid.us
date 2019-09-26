const { api, combineEffects, preventDefault, redirect } = require('../helpers')
const fetch = require('isomorphic-fetch')

module.exports = (event, state) => {
  switch (event.type) {
    case 'pageLoaded':
      switch (state.location.route) {
        case '/legislation/:shortId/import':
        case '/nominations/:shortId/import':
        case '/:username/:shortId/import':
          if (!state.user) return [state, redirect('/join')]
          return [state]
        default:
          return [state]
      }
    case 'import:authorSearched':
      return [{
        ...state,
        loading: { ...state.loading, proxySearch: true },
      }, combineEffects([preventDefault(event.event), importEffect('searchAuthor', event, state.user)])]
    case 'import:authorSearchResultsUpdated':
        return [{
          ...state,
          loading: { ...state.loading, authorSearch: false },
          authorSearchResults: event.results,
          authorSearchTerms: event.terms,
        }]
    case 'import:voteImportFormSubmitted':
      return [{
        ...state,
        loading: {
          ...state.loading,
          voteImport: true,
        },
      }, combineEffects([preventDefault(event.event), importVote(event, state.location.url, state.user)])]
    default:
      return [state]
  }
}

const importVote = ({ type, event, ...form }, url, user) => (dispatch) => {
  const twitter_username = (form.twitter_username || '').replace('@', '')
  fetch('/rpc/twitter_username_search', {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({ twitter_username }),
  })
  .then(res => {
    if (res.status === 404) {
      return res.json().then(json => {
        return Promise.reject(new Error(json.message))
      })
    }
    return res.json()
  })
  .then((twitterApiResult) => {
    if (!twitterApiResult) {
      return Promise.reject(new Error('No Twitter user found'))
    }

    return api(dispatch, '/rpc/import_vote', {
      method: 'POST',
      body: JSON.stringify({
        ...form,
        twitter_username: twitterApiResult.twitter_username.replace(/@/g, ''),
        twitter_displayname: twitterApiResult.name,
        twitter_avatar: twitterApiResult.avatar,
        twitter_bio: twitterApiResult.description,
      }),
      user,
    })
  })
  .then(() => dispatch({ type: 'redirected', url: url.replace('/import', '') }))
  .catch((error) => dispatch({ type: 'error', error }))
}
const importEffect = (name, ...args) => (dispatch) => {
  return import('../effects/import').then((effects) => {
    return (effects.default || effects)[name].apply(null, args)(dispatch)
  })
}
