const Component = require('./Component')

module.exports = class NavBarAnon extends Component {
  render() {
    const current_path = this.location.path

    return this.html`
      <a class=${`navbar-item ${current_path.slice(0, 12) === '/legislation' ? 'is-active' : ''}`} href="/legislation">Legislation</a>
      <a class=${`navbar-item has-text-link has-text-weight-bold ${current_path === '/join' ? 'is-active' : ''}`} href="/join">Join</a>
      <a class=${`navbar-item ${current_path.slice(0, 8) === '/sign_in' ? 'is-active' : ''}`} href="/sign_in">Sign in</a>
    `
  }
}
