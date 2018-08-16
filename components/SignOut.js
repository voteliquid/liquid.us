const Component = require('./Component')

module.exports = class SignOut extends Component {
  oninit() {
    return this.signOut()
  }
  onconnected() {
    return this.signOut()
  }
  signOut() {
    const refresh_token = this.storage.get('refresh_token')

    this.storage.unset('device_id')
    this.storage.unset('jwt')
    this.storage.unset('refresh_token')
    this.storage.unset('user_id')
    this.storage.unset('role')
    this.storage.unset('proxying_user_id')
    this.storage.unset('proxied_user_id')
    this.storage.unset('vote_position')
    this.storage.unset('vote_bill_id')
    this.storage.unset('vote_bill_short_id')
    this.storage.unset('vote_comment')

    this.setState({ user: null }, false)

    if (refresh_token) {
      return this.api(`/sessions?select=jwt&refresh_token=eq.${refresh_token}`, {
        method: 'DELETE',
      })
      .then(() => this.location.redirect('/'))
      .catch((error) => console.error(error))
    }

    this.location.redirect('/')
  }
  render() {
    return this.html`
      <section class="section hero">
        <div class="hero-body">
          <h1 class="title">Signing out...</h1>
        </div>
      </div>
    `
  }
}
