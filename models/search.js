const { api } = require('../helpers')

module.exports = (event, state) => {
  switch (event.type) {
    case 'blurred':
      return [state, deactivate]
    case 'inputFocused':
      return [{ ...state, showResults: !!event.event.target.value }]
    case 'deactivated':
      return [{ ...state, showResults: false }]
    case 'inputChanged':
      const query = (event.event.target ? event.event.target.value : '').trim()

      if (event.event.key === 'Escape') {
        return [{ ...state, showResults: false }]
      } else if (event.event.key === 'Enter') {
        return [state, navigateToFirstResult]
      } else if (event.event.key === 'ArrowDown') {
        return [state, focusFirstResult]
      } else if (!query) {
        return [{ ...state, showResults: false, results: [] }]
      }

      return [state, fetchSearchResult(query)]
    case 'resultFocused':
      const { id, first_name, last_name, short_id, number, title } = event.result
      const measureNum = number ? short_id.replace(/^[^-]+-(\D+)(\d+)/, '$1 $2').toUpperCase() : title
      const inputValue = first_name ? `${first_name} ${last_name}` : measureNum
      return [{
        ...state,
        results: state.results.map((result) => {
          return result.id === id ? { ...result, focused: true } : result
        })
      }, updateInputValue(inputValue)]
    case 'resultsKeyPressed':
      if (event.event.key === 'ArrowUp') {
        return [state, focusPrevResult(event.event)]
      } else if (event.event.key === 'ArrowDown') {
        return [state, focusNextResult(event.event)]
      } else if (event.event.key === 'Enter') {
        return [state, resetSearchInput]
      } else if (event.key === 'Escape') {
        return [{ ...state, showResults: false }]
      }

      return [state]
    case 'resultsRequested':
      return [{ ...state, query: event.query, loading: true }]
    case 'resultsReceived':
      return [{ ...state, loading: false, results: event.results, showResults: true }]
    case 'resultsError':
      console.error(event.error)
      return [{ ...state, loading: false }]
    default:
      return [state]
  }
}

const debounce = (function debouncer() {
  let timeout = null
  return (fn, ms) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(fn, ms)
  }
}())

const deactivate = (dispatch) => {
  debounce(() => {
    if (document.activeElement.className !== 'search-result') {
      dispatch({ type: 'deactivated' })
    }
  }, 100)
}

const navigateToFirstResult = (dispatch) => {
  document.querySelector('.search-results > a').click()
  document.querySelector('.search form').reset()
  dispatch({ type: 'deactivated' })
}

const focusFirstResult = () => {
  document.querySelector('.search-results > a').focus()
}

const fetchSearchResult = (query = '') => (dispatch) => {
  debounce(() => {
    dispatch({ type: 'resultsRequested', query })

    const fts = encodeURIComponent(query.trim().replace(/ /g, ':* & ').replace(/(.)$/, '$1:*'))
    api(dispatch, `/search_results_detailed?terms=fts(simple).${fts}&resource_id=not.eq.f2f3190b-eb4a-49fe-b160-3daca3ec3273&resource=not.is.null&limit=5`)
      .then((results) => dispatch({ type: 'resultsReceived', results }))
      .catch((error) => dispatch({ type: 'resultsError', error }))
  }, 300)
}

const resetSearchInput = (dispatch) => {
  setTimeout(() => {
    document.querySelector('.search form').reset()
    dispatch({ type: 'deactivated' })
  }, 100)
}

const focusPrevResult = (event) => () => {
  event.preventDefault()
  const p = event.target.previousSibling
  if (p) p.focus()
}

const focusNextResult = (event) => () => {
  event.preventDefault()
  const n = event.target.nextSibling
  if (n) n.focus()
}

const updateInputValue = (inputValue) => () => {
  document.querySelector('.search form input').value = inputValue
}
