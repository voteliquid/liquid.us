const { api, avatarURL, html } = require('../helpers')

module.exports = {
  init: [{
    loading: false,
    query: '',
    results: [],
    showResults: false,
  }],
  update: (event, state) => {
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
        const { id, first_name, last_name, type, number } = event.result
        const measureNum = `${type} ${number}`
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
  },
  view: ({ loading, query, results, showResults }, dispatch) => {
    return html()`
      <div class="search" style="position: relative; width: 100%;">
        <form method="GET">
          <div class="field">
            <div class="${`control has-icons-left is-expanded ${loading ? 'is-loading' : ''}`}">
              <input
                onfocus=${(event) => dispatch({ type: 'inputFocused', event })}
                onblur=${(event) => dispatch({ type: 'blurred', event })}
                onkeyup=${(event) => dispatch({ type: 'inputChanged', event })}
                class="input" placeholder="Search Bills or People" />
              <span class="icon is-left">
                <i class="fa fa-search"></i>
              </span>
            </div>
            <button type="submit" class="is-hidden">Search</button>
          </div>
        </form>
        ${showResults ? searchResults({ query, results }, dispatch) : ''}
      </div>
    `
  }
}

const noSearchResultsMsg = ({ query }) => {
  return html()`
    <div class="search-result">
      <p class="notification">No results for "<span class="has-text-weight-semibold">${query}</span>".</p>
    </div>
  `
}

const searchResults = ({ query, results = [] }, dispatch) => {
  const style = {
    backgroundColor: 'white',
    borderLeft: '1px solid #eee',
    borderRight: '1px solid #eee',
    borderBottom: '1px solid #eee',
    top: '2.25rem',
    right: 0,
    left: 0,
    padding: '1rem 0 .5rem',
    position: 'absolute',
    zIndex: 999,
  }

  return html()`
    <div class="search-results" style="${style}" onkeydown=${(event) => dispatch({ type: 'resultsKeyPressed', event })}>
      <style>
        .search-results.has-results {
          box-shadow: 0 0 1rem rgba(0, 0, 0, 0.1);
        }
        .search-result:hover, .search-result:active, .search-result:focus {
          background-color: #f5f5f5;
        }
      </style>
      ${results.length
      ? results.map(({ resource_type, resource }) => {
          const searchResult = resource_type === 'user' ? userSearchResult : measureSearchResult
          return searchResult(resource, dispatch)
        })
      : query ? noSearchResultsMsg({ query }) : ''}
    </div>
  `
}

const userSearchResult = (result, dispatch) => {
  const { id, first_name, last_name, direct_proxy_count, username, twitter_username } = result
  const href = username ? `/${username}` : `/twitter/${twitter_username}`
  return html(id)`
    <a
      onblur="${(event) => dispatch({ type: 'blurred', event })}"
      onclick="${(event) => dispatch({ type: 'blurred', event })}"
      onfocus="${() => dispatch({ type: 'resultFocused', result })}" href="${href}" class="search-result" style="display: block; padding: .3rem 1rem;">
      <div class="media is-marginless">
        <div class="media-left">
          <div class="image is-32x32" style="${{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}">
            <img src=${avatarURL(result)} class="round-avatar-img" />
          </div>
        </div>
        <div class="media-content">
          <div>
            <span>${first_name} ${last_name}</span>
            <span class="has-text-grey is-size-7">@${username || twitter_username}</span>
          </div>
          <div class="${direct_proxy_count ? 'is-size-7 has-text-grey' : 'is-hidden'}">
            <span class="icon is-small"><i class="fa fa-users is-small"></i></span>
            <span>Represents ${direct_proxy_count} ${direct_proxy_count === 1 ? 'person' : 'people'} directly</span>
          </div>
        </div>
      </div>
    </a>
  `
}

const truncateResultTitle = (str) => {
  if (str < 50) return str
  str = str.slice(0, 50)
  if (str[str.length - 1] === ' ') {
    return `${str.slice(0, -1)}...`
  }
  return `${str}...`
}

const measureSearchResult = ({ number, type, title, legislature_name, short_id }, dispatch) => {
  const titleFmt = `${type} ${number} ${truncateResultTitle(title)}`
  const href = type === 'PN' ? `/nominations/${short_id}` : `/legislation/${short_id}`
  return html(short_id)`
    <a onblur="${dispatch}" onclick="${dispatch}" onfocus="${dispatch}" href="${href}" class="search-result" style="display: block; padding: .3rem 1rem;">
      <div class="media is-marginless">
        <div class="media-left">
          <div
            class="image is-32x32 has-text-grey"
            style="${{ alignItems: 'center', display: 'flex', justifyContent: 'center' }}"
          >
            <i class="fa fa-landmark"></i>
          </div>
        </div>
        <div class="media-content">
          <div>${titleFmt}</div>
          <div class="is-size-7 has-text-grey">
            <span>${legislature_name}</span>
          </div>
        </div>
      </div>
    </a>
  `
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
    api(`/search_results_detailed?terms=fts(simple).${fts}&resource_id=not.eq.f2f3190b-eb4a-49fe-b160-3daca3ec3273&limit=5`)
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
