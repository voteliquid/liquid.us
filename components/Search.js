const Component = require('./Component')

module.exports = class Search extends Component {
  dispatch(state) {
    this.setState({ search: { ...this.state.search, ...state } })
  }
  onblur() {
    if (this.debounce) clearTimeout(this.debounce)
    setTimeout(() => {
      if (document.activeElement.className !== 'search-result') {
        this.dispatch({ showResults: false })
      }
    }, 100)
  }
  onfocus(event) {
    if (event.target.value) {
      this.dispatch({ showResults: true })
    }
  }
  onkeyup(event) {
    if (this.debounce) clearTimeout(this.debounce)

    if (event.key === 'Escape') {
      this.dispatch({ showResults: false })
    } else if (event.key === 'Enter') {
      document.querySelector('.search-results > a').click()
      document.querySelector('.search form').reset()
      this.dispatch({ showResults: false })
    } else if (event.key === 'ArrowDown') {
      document.querySelector('.search-results > a').focus()
    } else {
      this.debounce = setTimeout(() => {
        this.search({ query: event.target.value || '' })
      }, 300)
    }
  }
  search({ query }) {
    if (!query.trim()) {
      return this.dispatch({ showResults: false, results: [] })
    }
    const fts = encodeURIComponent(query.trim().replace(/ /g, ':* & ').replace(/(.)$/, '$1:*'))
    this.dispatch({ loading: true })
    return this.api(`/search_results_detailed?terms=fts(english).${fts}&resource_id=not.eq.f2f3190b-eb4a-49fe-b160-3daca3ec3273&limit=5`)
      .then((results) => this.dispatch({ showResults: true, loading: false, query, results }))
      .catch((error) => {
        console.error(error)
        this.dispatch({ loading: false })
      })
  }
  render(_, state) {
    const { showResults, loading, query = '', results = [] } = state.search || {}
    return this.html`
      <div class="search" style="position: relative; width: 100%;">
        <form action=${this} method="GET">
          <div class="field">
            <div class="${`control has-icons-left is-expanded ${loading ? 'is-loading' : ''}`}">
              <input onfocus=${this} onblur=${this} onkeyup=${this} class="input" placeholder="Search Bills or People" />
              <span class="icon is-left">
                <i class="fa fa-search"></i>
              </span>
            </div>
            <button type="submit" class="is-hidden">Search</button>
          </div>
        </form>
        ${showResults ? SearchResults.for(this, { query, results }) : ''}
      </div>
    `
  }
}

class NoSearchResultsMsg extends Component {
  render({ query }) {
    return this.html`
      <div class="search-result">
        <p class="notification">No results for "<span class="has-text-weight-semibold">${query}</span>".</p>
      </div>
    `
  }
}

class SearchResults extends Component {
  onkeydown(event) {
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      const p = event.target.previousSibling
      if (p) p.focus()
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      const n = event.target.nextSibling
      if (n) n.focus()
    } else if (event.key === 'Enter') {
      setTimeout(() => {
        document.querySelector('.search form').reset()
        this.setState({ search: { ...this.state.search, showResults: false } })
      }, 100)
    } else if (event.key === 'Escape') {
      this.setState({ search: { ...this.state.search, showResults: false } })
    }
  }
  render({ query, results = [] }) {
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
    return this.html`
      <div class="search-results" style="${style}" onkeydown="${this}">
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
            const Result = resource_type === 'user' ? UserSearchResult : MeasureSearchResult
            return Result.for(this, resource, `search-result-${resource.id}`)
          })
        : query ? NoSearchResultsMsg.for(this, { query }) : ''}
      </div>
    `
  }
}

class SearchResult extends Component {
  onblur() {
    setTimeout(() => {
      if (document.activeElement.className !== 'search-result') {
        this.setState({ search: { ...this.state.search, showResults: false } })
      }
    }, 100)
  }
  onclick(event) {
    event.preventDefault()
    this.location.redirect(303, event.currentTarget.getAttribute('href'))
    setTimeout(() => {
      document.querySelector('.search form input').value = ''
      this.setState({ search: { ...this.state.search, showResults: false } })
    }, 100)
  }
  onfocus() {
    const { id, first_name, last_name, type, number } = this.props
    const measureNum = `${type} ${number}`
    document.querySelector('.search form input').value = first_name ? `${first_name} ${last_name}` : measureNum
    this.setState({
      search: {
        ...this.state.search,
        results: this.state.search.results.map((result) => {
          if (result.id === id) {
            result.focused = true
            return result
          }
          return result
        }),
      },
    })
  }
}

class UserSearchResult extends SearchResult {
  render({ first_name, last_name, direct_proxy_count, username, twitter_username }) {
    const href = username ? `/${username}` : `/twitter/${twitter_username}`
    return this.html`
      <a onblur="${this}" onclick="${this}" onfocus="${this}" href="${href}" class="search-result" style="display: block; padding: .3rem 1rem;">
        <div class="media is-marginless">
          <div class="media-left">
            <div class="image is-32x32" style="${{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}">
              <img src=${this.avatarURL(this.props)} class="round-avatar-img" />
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
}

class MeasureSearchResult extends SearchResult {
  truncate(str) {
    if (str.length < 60) return str
    str = str.slice(0, 60)
    if (str[str.length - 1] === ' ') {
      return `${str.slice(0, -1)}...`
    }
    return `${str}...`
  }
  render({ number, type, title, legislature_name, short_id }) {
    const titleFmt = number ? `${type} ${number} ${this.truncate(title)}` : this.truncate(title)
    const href = type === 'PN' ? `/nominations/${short_id}` : `/legislation/${short_id}`
    return this.html`
      <a onblur="${this}" onclick="${this}" onfocus="${this}" href="${href}" class="search-result" style="display: block; padding: .3rem 1rem;">
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
}
