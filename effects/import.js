const { api } = require('../helpers')

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
