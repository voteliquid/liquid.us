const Component = require('./Component')

module.exports = class SignIn extends Component {
  oninit() {
    const proxying_user_id = this.storage.get('proxying_user_id')

    if (this.state.user) {
      this.location.setStatus(403)
      return this.location.redirect('/')
    }

    // If they got here from attempting to proxy from profile page
    if (this.location.query.notification === 'proxy' && proxying_user_id) {
      return this.api(`/user_profiles?select=user_id,first_name,last_name&user_id=eq.${proxying_user_id}`)
        .then(users => {
          if (users[0]) {
            return { req_proxy_profile: users[0] }
          }
        })
    }
  }
  onsubmit(event, formData) {
    event.preventDefault()

    const phone_user_id = formData.phone_user_id || null
    const email = formData.email.toLowerCase().trim()
    const proxying_user_id = this.storage.get('proxying_user_id')
    const vote_position = this.storage.get('vote_position')

    return this.api(`/rpc/request_email_totp`, {
      method: 'POST',
      body: JSON.stringify({ email, device_desc: this.location.userAgent || 'Unknown' }),
    })
    .then(({ device_secret, jwt, refresh_token, user_id }) => {
      const oneYearFromNow = new Date(Date.now() + (365 * 24 * 60 * 60 * 1000))

      if (event.target) {
        event.target.reset()
      }

      if (jwt) {
        this.storage.set('jwt', jwt, { expires: oneYearFromNow })
        this.storage.set('refresh_token', refresh_token, { expires: oneYearFromNow })
        this.storage.set('user_id', user_id, { expires: oneYearFromNow })

        return this.api(`/users?select=id,email,first_name,last_name,username,cc_verified,voter_status,update_emails_preference,address:user_addresses(id,address)&id=eq.${user_id}`)
        .then(users => {
          this.setState({ user: { ...users[0], address: users[0].address[0] } }, false)

          if (proxying_user_id) {
            return this.api('/delegations', {
              method: 'POST',
              headers: { Prefer: 'return=representation' }, // returns created delegation in response
              jwt,
              body: JSON.stringify({
                from_id: user_id,
                to_id: proxying_user_id,
                delegate_rank: 0,
              }),
            })
            .then(() => {
              this.storage.set('proxied_user_id', proxying_user_id)
              this.storage.unset('proxying_user_id')
              return this.location.redirect(303, '/get_started')
            })
            .catch(error => {
              console.log(error)
              return this.location.redirect(303, '/get_started')
            })
          }

          if (vote_position) {
            return this.api('/rpc/vote', {
              method: 'POST',
              jwt,
              body: JSON.stringify({
                user_id,
                legislation_id: this.storage.get('vote_bill_id'),
                vote_position,
                comment: this.storage.get('vote_comment') || null,
                public: this.storage.get('vote_public') === 'true',
              }),
            })
            .then(() => {
              this.storage.unset('vote_position')
              this.storage.unset('vote_bill_id')
              this.storage.unset('vote_public')
              this.storage.unset('vote_comment')
              return this.location.redirect(303, '/get_started')
            })
            .catch(error => {
              console.log(error)
              return this.location.redirect(303, '/get_started')
            })
          }

          return this.location.redirect(303, '/get_started')
        })
      }

      this.storage.set('sign_in_email', email)
      this.storage.set('device_secret', device_secret)

      return this.location.redirect(303, '/sign_in/verify')
    })
    .catch((error) => {
      if (~error.message.indexOf('constraint "email')) {
        error.message = 'Invalid email address'
      }
      return { error }
    })
  }
  render() {
    const proxying_user_id = this.storage.get('proxying_user_id')
    const vote_position = this.storage.get('vote_position')
    const { error, req_proxy_profile } = this.state

    return this.html`
      <section class="section">
        <div class="container has-text-centered">
          ${proxying_user_id && req_proxy_profile ? [`
            <div class="notification has-text-centered is-info">
              Sign in to proxy to ${req_proxy_profile.first_name} ${req_proxy_profile.last_name}.
            </div>
          `] : []}
          ${vote_position ? [`
            <div class="notification has-text-centered is-info">Sign in to save your vote and hold your representatives accountable.</div>
          `] : []}
          <h1 class="title">Sign in</h1>
          <div class="level">
            <div class="level-item has-text-centered">
              <form action=${this} onsubmit=${this} class="box" method="POST">
                <div class="field">
                  <label for="email">Enter your email to sign in</label>
                </div>
                <div class="field has-addons">
                  <div class="${`control is-expanded has-icons-left ${error ? 'has-icons-right' : ''}`}">
                    <input name="email" class="${`input ${error ? 'is-danger' : ''}`}" type="text" placeholder="you@example.com" />
                    <span class="icon is-small is-left">
                      <i class="fa fa-user"></i>
                    </span>
                    ${error ? [`<span class="icon is-small is-right">
                      <i class="fa fa-warning"></i>
                    </span>`] : ''}
                    ${error ? [`<p class="help is-danger">${error}</p>`] : ''}
                  </div>
                  <div class="control">
                    <button class="button is-primary" type="submit"><strong>Sign in</strong></button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    `
  }
}
