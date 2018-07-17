const Component = require('./Component')
const NavBarAnon = require('./NavBarAnon')
const NavBarAuthed = require('./NavBarAuthed')

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
        <div class="container">
          ${[style]}
          <div class="navbar-brand">
            <a class="navbar-item" href="/">
              <img src=${`${ASSETS_URL}/united-vote-logo-100px.png`} alt="United.vote" />
            </a>

            <a role="button" href="#" aria-label="menu" aria-expanded="${hamburgerVisible ? 'true' : 'false'}" class="${`navbar-burger ${hamburgerVisible ? 'is-active' : ''}`}" onclick=${this}>
              <span aria-hidden="true"></span>
              <span aria-hidden="true"></span>
              <span aria-hidden="true"></span>
            </a>
          </div>
          <div class=${`navbar-menu ${hamburgerVisible ? 'is-active' : ''}`}>
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
    .navbar-brand .navbar-item img {
      margin: 4px 0;
      max-height: 40px;
      padding-left: 3px;
    }

    @media (max-width: 1087px) {
      .navbar-brand .navbar-item {
        padding: 0rem 1rem;
        padding-left: 21px;
      }

      <!-- https://github.com/jgthms/bulma/issues/1952 -->
      .navbar .container .navbar-brand {
        margin-left: -0.75rem !important;
      }
      .navbar .container .navbar-menu {
        margin-right: -0.75rem;
      }

      .navbar-brand .navbar-item img {
        margin: 0;
        padding-top: 4px;
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
