const { api } = require('../helpers')
const fetch = require('isomorphic-fetch')

exports.fetchMeasure = (shortId, { user }) => (dispatch) => {
  return api(dispatch, `/measures_detailed?short_id=eq.${shortId}`, { user })
    .then(([measure]) => {
      dispatch({ type: 'cookieSet', key: 'measure_title', value: measure.title })
      dispatch({ type: 'cookieSet', key: 'measure_id', value: measure.id })
      dispatch({ type: 'cookieSet', key: 'measure_short_id', value: measure.short_id })
    })
  }
exports.searchAuthor = ({ event, ...formData }, user) => (dispatch) => {
  const terms = formData.add_author && formData.add_author.search && formData.add_author.search

  if (!terms) return dispatch({ type: 'authorSearchResultsUpdated', results: [], terms })

  return api(dispatch, `/search_results_detailed?terms=fts(english).${encodeURIComponent(terms.replace(/ /g, ':* & ').replace(/$/, ':*'))}&resource_type=eq.user&limit=5`, { user })
    .then((results) => {
      return dispatch({
        type: 'import:authorSearchResultsUpdated',
        results: results.filter(({ resource }) => resource.twitter_username !== 'dsernst').map(({ resource }) => resource),
        terms,
      })
    })
    .catch(error => dispatch({ type: 'error', error }))
}
exports.addAuthorViaEmail = ({ event, ...formData }, proxies, user) => (dispatch) => {
  if (!formData.add_author) return

  const name = formData.add_author.name.trim().split(' ')

  if (name.length < 2) {
    return dispatch({ type: 'error', error: Object.assign(new Error('Please enter a first and last name'), { name: true }) })
  } else if (name.length > 5) {
    return dispatch({ type: 'error', error: Object.assign(new Error('Please enter only a first and last name'), { name: true }) })
  }

  const first_name = formData.add_author.name.trim().split(' ')[0]
  const last_name = formData.add_author.name.trim().split(' ').slice(1).join(' ')

  return api(dispatch, '/users', {
    method: 'POST',
    body: JSON.stringify({
      first_name,
      last_name,
      username: formData.add_author.username,
      email: formData.add_author.email ? formData.add_author.email.toLowerCase().trim() : null,
    }),
    user,
  })
  .then((user) => {
    dispatch({ type: 'cookieSet', key: 'author_id', value: user.author_id })
    dispatch({ type: 'cookieSet', key: 'author_username', value: user.username })

  })
  .catch(errorHandler(dispatch))
}

exports.addAuthorViaTwitter = ({ event, ...formData }, proxies, user) => (dispatch) => {
  if (!formData.add_author) return

  let twitter_username = null
  if (formData.add_author.twitter_username) {
    twitter_username = formData.add_author.twitter_username.trim().replace(/@/g, '')
  }

  return fetch('/rpc/twitter_username_search', {
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
  .then((twitter_user) => {
    return api(dispatch, '/delegations', {
      method: 'POST',
      headers: { Prefer: 'return=representation' }, // returns created delegation in response
      body: JSON.stringify({
        from_id: user.id,
        twitter_username: twitter_user.twitter_username.replace(/@/g, ''),
        twitter_displayname: twitter_user.name,
        twitter_avatar: twitter_user.avatar,
        bio: twitter_user.description,
        delegate_rank: 0,
      }),
      user,
    })
    .then((newProxies) => {
      if (event) event.target.reset()
      return api(dispatch, `/delegations_detailed?id=eq.${newProxies[0].id}`, { user }).then(profiles => {
        return dispatch({
          type: 'proxy:proxiesUpdated',
          proxies: (proxies || []).concat(profiles[0] || newProxies[0]),
        })
      })
    })
  })
  .catch(errorHandler(dispatch))
}

exports.addAuthorViaSearch = ({ event, ...formData }) => (dispatch) => {
  dispatch({ type: 'cookieSet', key: 'author_id', value: formData.author_id })
  dispatch({ type: 'cookieSet', key: 'author_username', value: formData.author_username })
}
const errorHandler = (error) => {
  if (error.code === 23514) {
    if (~error.message.indexOf('email')) {
      error.email = true
      error.message = 'Invalid email address'
    }
  }
}
