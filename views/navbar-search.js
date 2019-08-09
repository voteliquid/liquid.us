const { avatarURL, html } = require('../helpers')

module.exports = (state, dispatch) => {
  const { loading, showResults } = state
  return html`
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
      ${showResults ? searchResults(state, dispatch) : ''}
    </div>
  `
}

const noSearchResultsMsg = ({ query }) => {
  return html`
    <div class="search-result">
      <p class="notification">No results for "<span class="has-text-weight-semibold">${query}</span>".</p>
    </div>
  `
}

const searchResults = (state, dispatch) => {
  const { query, results = [] } = state
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

  return html.for(state, `search-results-${state.query}`)`
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
        : query ? [noSearchResultsMsg({ query })] : []}
    </div>
  `
}

const userSearchResult = (result, dispatch) => {
  const { first_name, last_name, direct_proxy_count, username, twitter_username } = result
  const href = username ? `/${username}` : `/twitter/${twitter_username}`
  return html`
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
  if (str.length < 60) return str
  str = str.slice(0, 60)
  if (str[str.length - 1] === ' ') {
    return `${str.slice(0, -1)}...`
  }
  return `${str}...`
}

const measureSearchResult = ({ author_username, number, type, title, legislature_name, short_id }, dispatch) => {
  const truncatedTitle = truncateResultTitle(title)
  const measureNum = number ? short_id.replace(/^[^-]+-(\D+)(\d+)/, '$1 $2').toUpperCase() : ''
  const titleFmt = measureNum ? `${measureNum} ${truncatedTitle}` : truncatedTitle
  let href = `/${author_username}/`
  if (!author_username) {
    href = type === 'nomination' ? '/nominations/' : '/legislation/'
  }
  href += short_id

  return html`
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
