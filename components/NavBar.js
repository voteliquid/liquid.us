const Component = require('./Component')
const NavBarAnon = require('./NavBarAnon')
const NavBarAuthed = require('./NavBarAuthed')
const Search = require('./Search')

module.exports = class NavBar extends Component {
  onclick(event) {
    event.preventDefault()
    return { hamburgerVisible: !this.state.hamburgerVisible }
  }
  render() {
    const { config, hamburgerVisible, user } = this.state
    const { ASSETS_URL } = config

    return this.html`
      <nav class="navbar" role="navigation" aria-label="main navigation">
        <div class="container is-widescreen">
          ${[style]}
          <div class="navbar-brand">
            <a class="navbar-item" href="/">
              <img src=${`${ASSETS_URL}/united-vote-logo-100px.png`} alt="United.vote" />
            </a>

            <div role="button" href="#" aria-label="menu" aria-expanded="${hamburgerVisible ? 'true' : 'false'}" class="${`navbar-burger burger ${hamburgerVisible ? 'is-active' : ''}`}" onclick=${this}>
              <span aria-hidden="true"></span>
              <span aria-hidden="true"></span>
              <span aria-hidden="true"></span>
            </div>
          </div>
          <div class=${`navbar-menu ${hamburgerVisible ? 'is-active' : ''}`}>
              <div class="navbar-item" style="flex-grow: 1;">${Search.for(this)}</div>
            <div class="navbar-end">
              ${user ? NavBarAuthed.for(this, 'authed') : NavBarAnon.for(this)}
            </div>
          </div>
        </div>
      </nav>
    `
  }
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
