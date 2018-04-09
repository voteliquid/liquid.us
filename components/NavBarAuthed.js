const Component = require('./Component')

module.exports = class NavBarAnon extends Component {
  render() {
    const { config, user } = this.state
    const { WWW_URL } = config
    const username_url = user.username ? `/${user.username}` : '/get_started/profile'
    const current_path = this.location.path

    return this.html`
      <a class=${`navbar-item ${current_path === '/legislation' ? 'is-active' : ''}`} href="/legislation">Legislation</a>
      <a class=${`navbar-item ${current_path === '/legislators' ? 'is-active' : ''}`} href="/legislators">Congress Members</a>
      <a class=${`navbar-item ${current_path === '/proxies' ? 'is-active' : ''}`} href="/proxies">Proxies</a>
      <div class="navbar-item has-dropdown is-hoverable">
        <a class="navbar-link" href="${username_url}">${user.first_name}</a>
        <div class="navbar-dropdown is-right">
          <a class=${`navbar-item ${current_path === username_url ? 'is-active' : ''}`} href=${username_url}>Profile</a>
          <a class=${`navbar-item ${current_path === '/proxies/requests' ? 'is-active' : ''}`} href="/proxies/requests">Proxy Requests</a>
          ${!user.cc_verified ?
            [`<a class=${`navbar-item ${current_path === '/get_started' ? 'is-active' : ''}`} href="/get_started">Identity Verification</a>`] :
            ''}
          <a class=${`navbar-item ${current_path === '/settings' ? 'is-active' : ''}`} href="/settings">Settings</a>
          <a class=${`navbar-item ${current_path === '/sign_out' ? 'is-active' : ''}`} href=${`${WWW_URL}/sign_out`}>Sign out</a>
        </div>
      </div>
    `
  }
}
