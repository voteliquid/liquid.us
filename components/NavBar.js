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
        <div class="navbar-brand">
          <a class="navbar-item" href="/">
            <img src=${`${ASSETS_URL}/united-vote-logo-100px.png`} alt="United.vote" />
          </a>
          <style>
            .navbar-brand .navbar-item img {
              margin: 4px 0;
              max-height: 40px;
            }
            @media (max-width: 1024px) {
              .navbar-brand .navbar-item {
                padding: 0rem 1rem;
              }

              .navbar-brand .navbar-item img {
                margin: 0;
                padding-top: 4px;
              }
              .navbar-menu a.navbar-item:hover {
                background-color: #f5f5f5 !important;
              }
              a.navbar-item.is-active {
                border-top: 2px solid transparent !important;
              }
            }
            a.navbar-item:hover {
              background-color: transparent;
            }
            a.navbar-item {
              border-top: 2px solid transparent;
            }
            a.navbar-item.is-active {
              border-top: 2px solid #3272dc;
            }
          </style>

          <button class="button navbar-burger" onclick=${this}>
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
        <div class=${`navbar-menu ${hamburgerVisible ? 'is-active' : ''}`}>
          <div class="navbar-end">
            ${user ? NavBarAuthed.for(this, 'authed') : NavBarAnon.for(this)}
          </div>
        </div>
      </nav>
    `
  }
}
