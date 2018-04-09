const Component = require('./Component')

module.exports = class NavBarAnon extends Component {
  render() {
    const current_path = this.location.path

    return this.html`
      <a class=${`navbar-item ${current_path === '/legislation' ? 'is-active' : ''}`} href="/legislation">Legislation</a>
      <a class=${`navbar-item ${current_path === '/legislators' ? 'is-active' : ''}`} href="/legislators">Congress Members</a>
      <a class=${`navbar-item ${current_path === '/proxies' ? 'is-active' : ''}`} href="/proxies">Proxies</a>
      <a class=${`navbar-item has-text-link has-text-weight-bold ${current_path === '/join' ? 'is-active' : ''}`} href="/join">Join</a>
      <a class=${`navbar-item ${current_path === '/sign_in' ? 'is-active' : ''}`} href="/sign_in">Sign in</a>
    `
  }
}
