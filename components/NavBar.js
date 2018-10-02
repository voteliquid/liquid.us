const { APP_NAME, ASSETS_URL, WWW_URL } = process.env
const { html, mapEffect, mapEvent, preventDefault } = require('../helpers')
const Search = require('./Search')

module.exports = {
  init: [{
    hamburgerVisible: false,
    location: {},
    search: Search.init[0],
    user: null,
  }],
  update: (event, state) => {
    switch (event.type) {
      case 'hamburgerClicked':
        return [{
          ...state,
          hamburgerVisible: !state.hamburgerVisible,
        }, preventDefault(event.event)]
      case 'searchEvent':
        const [searchState, searchEffect] = Search.update(event.event, state.search)
        return [
          { ...state, search: searchState },
          mapEffect('searchEvent', searchEffect),
        ]
      default:
        return [state]
    }
  },
  view: ({ hamburgerVisible, location, search, user }, dispatch) => {
    return html()`
      <nav class="navbar" role="navigation" aria-label="main navigation">
        <div class="container is-widescreen">
          ${[style]}
          <div class="navbar-brand">
            <a class="navbar-item" href="/">
              <img src=${`${ASSETS_URL}/united-vote-logo-100px.png`} alt="${APP_NAME}" />
            </a>

            <div role="button" href="#" aria-label="menu" aria-expanded="${hamburgerVisible ? 'true' : 'false'}" class="${`navbar-burger burger ${hamburgerVisible ? 'is-active' : ''}`}" onclick=${(event) => dispatch({ type: 'hamburgerClicked', event })}>
              <span aria-hidden="true"></span>
              <span aria-hidden="true"></span>
              <span aria-hidden="true"></span>
            </div>
          </div>
          <div class=${`navbar-menu ${hamburgerVisible ? 'is-active' : ''}`}>
            <div class="navbar-item" style="flex-grow: 1;">
              ${Search.view(search, mapEvent('searchEvent', dispatch))}
            </div>
            <div class="navbar-end">
              ${user ? navbarAuthed({ location, user }) : navbarAnon({ location })}
            </div>
          </div>
        </div>
      </nav>
    `
  },
}

const style = `
  <style>
    .navbar {
      padding: 0 1.5rem;
    }
    .navbar-burger {
      height: auto;
      width: 5rem;
    }

    .navbar-brand .navbar-item img {
      margin: 4px 0;
      max-height: 40px;
      padding-left: 3px;
    }

    @media (max-width: 1087px) {
      .navbar {
        padding: 0;
      }
      a.navbar-item:hover {
        background-color: #f5f5f5 !important;
      }
      a.navbar-item.is-active {
        border-top: 2px solid transparent !important;
      }
    }
    a.navbar-item:hover {
      background-color: transparent;
    }
    a.navbar-item,
    .navbar-dropdown a.navbar-item.is-active {
      border-top: 2px solid transparent;
    }
    a.navbar-item.is-active {
      border-top: 2px solid #3272dc;
    }
  </style>
`

const navbarAnon = ({ location }) => {
  const { path } = location
  return html()`
    <a class=${`navbar-item ${path.slice(0, 12) === '/legislation' ? 'is-active' : ''}`} href="/legislation">Legislation</a>
    <a class=${`navbar-item has-text-link has-text-weight-bold ${path === '/join' ? 'is-active' : ''}`} href="/join">Join</a>
    <a class=${`navbar-item ${path.slice(0, 8) === '/sign_in' ? 'is-active' : ''}`} href="/sign_in">Sign in</a>
  `
}

const navbarAuthed = ({ location, user }) => {
  const username_url = user.username ? `/${user.username}` : '/get_started/profile'
  const { path } = location

  return html()`
    <a class=${`navbar-item ${path.slice(0, 12) === '/legislation' ? 'is-active' : ''}`} href="/legislation">Legislation</a>
    <a class=${`navbar-item ${path.slice(0, 8) === '/proxies' ? 'is-active' : ''}`} href="/proxies">Your Proxies</a>
    <div class="navbar-item has-dropdown is-hoverable">
      <a class="navbar-link" href="${username_url}">${user.first_name || 'You'}</a>
      <div class="navbar-dropdown is-right">
        ${[
          !user.verified
            ? `<a class="navbar-item ${path.slice(0, 12) === '/get_started' ? 'is-active' : ''}" href="/get_started">Verify your identity</a>`
            : ''
        ]}
        <a class=${`navbar-item ${path === username_url ? 'is-active' : ''}`} href=${username_url}>Profile</a>
        ${[user.username
          ? `<a class=${`navbar-item ${path === '/edit_profile' ? 'is-active' : ''}`} href="/edit_profile">Edit Profile</a>`
          : '']}
        <a class=${`navbar-item ${path === '/proxies/requests' ? 'is-active' : ''}`} href="/proxies/requests">Proxy Requests</a>
        <a class=${`navbar-item ${path === `/legislation/yours` ? 'is-active' : ''}`} href="/legislation/yours">Proposed Legislation</a>
        <a class=${`navbar-item ${path === '/settings' ? 'is-active' : ''}`} href="/settings">Settings</a>
        <a class=${`navbar-item ${path === '/sign_out' ? 'is-active' : ''}`} href=${`${WWW_URL}/sign_out`}>Sign out</a>
      </div>
    </div>
  `
}
