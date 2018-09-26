const Component = require('./Component')

module.exports = class VerifyOTP extends Component {
  oninit() {
    const { user } = this.state
    const { redirect, setStatus, query } = this.location

    if (query.totp) {
      return this.onsubmit()
    }

    if (user) {
      setStatus(403)
      return redirect('/')
    }

    // Try to refresh the page every 10 seconds if the page is in the background
    // in case they verify in another window (from clicking link in sign_in email)
    if (this.isBrowser) {
      const browserCookies = require('browser-cookies')

      document.addEventListener('visibilitychange', () => {
        if (browserCookies.get('jwt')) {
          window.location.reload()
        }
      }, false)

      setInterval(() => {
        if (document.hidden && browserCookies.get('jwt')) {
          window.location.reload()
        }
      }, 10000)
    }
  }
  onclick(event) {
    event.preventDefault()

    const sign_in_email = this.storage.get('sign_in_email')
    const { redirect, userAgent } = this.location

    if (!sign_in_email) {
      return redirect('/sign_in')
    }

    return this.api('/totp?select=device_id', {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify({
        email: sign_in_email,
        device_desc: userAgent || 'Unknown',
        signup_channel: 'united.vote',
        cookie: null,
      }),
    })
    .then((results) => results[0])
    .then(({ device_id }) => {
      this.storage.set('device_id', device_id)
      return redirect(303, '/sign_in/verify?notification=resent_code')
    })
    .catch(api_error => {
      if (~api_error.message.indexOf('constraint "email')) {
        this.setState({ error: 'Invalid email address' })
      } else if (api_error.message === 'Please wait 10 seconds and try again') {
        this.setState({ error: api_error.message })
      } else {
        console.log(api_error)
        this.setState({ error: `There was a problem on our end. Please try again and let us know if you're still encountering a problem.` })
      }
    })
  }
  onsubmit(event, formData) {
    if (event) event.preventDefault()

    const { user } = this.state
    const { redirect, query, userAgent } = this.location

    if (user && !query.totp) {
      return redirect(303, '/get_started')
    }

    const signin_body = {
      totp: formData && formData.totp ? formData.totp.replace(/[^\d]/g, '') : query.totp,
      device_id: this.storage.get('device_id'),
      device_desc: userAgent,
    }

    return this.api('/sessions?select=refresh_token,user_id,jwt', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(signin_body),
    })
    .then((results) => results[0])
    .then(({ jwt, refresh_token, user_id }) => {
      this.storage.set('jwt', jwt, { expires: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)) })
      this.storage.set('refresh_token', refresh_token, { expires: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)) })
      this.storage.set('user_id', user_id, { expires: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)) })
      this.storage.unset('device_id')
      this.storage.unset('sign_in_email')

      return this.api(`/users?select=id,email,first_name,last_name,username,verified,voter_status,update_emails_preference,address:user_addresses(id,address)&id=eq.${user_id}`)
      .then(users => {
        this.setState({ user: { ...users[0], address: users[0].address[0] } }, false)
        return { jwt, user_id }
      })
    })
    .then(({ jwt, user_id }) => {
      const proxying_user_id = this.storage.get('proxying_user_id')
      const redirect_to = this.storage.get('redirect_to')
      const vote_position = this.storage.get('vote_position')

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
          return redirect(303, '/get_started')
        })
        .catch(error => {
          console.log(error)
          return redirect(303, `/get_started`)
        })
      }

      if (vote_position) {
        return this.api('/rpc/vote', {
          method: 'POST',
          jwt,
          body: JSON.stringify({
            user_id,
            measure_id: this.storage.get('vote_bill_id'),
            vote_position,
            comment: this.storage.get('vote_comment') || null,
            public: this.storage.get('vote_public') === 'true',
          }),
        })
        .then(() => {
          if (this.isBrowser && window._loq) window._loq.push(['tag', 'Voted'])
          this.storage.unset('vote_position')
          this.storage.unset('vote_bill_id')
          this.storage.unset('vote_public')
          this.storage.unset('vote_comment')
          return redirect(303, '/get_started')
        })
        .catch(error => {
          console.log(error)
          return redirect(303, '/get_started')
        })
      }

      if (redirect_to) {
        this.storage.unset('redirect_to')
        return redirect(303, redirect_to)
      }

      return redirect(303, '/get_started')
    })
    .catch((api_error) => {
      if (~api_error.message.indexOf('expired')) return { error: 'Invalid or expired one-time sign in code.' }
      return { error: `Something went wrong on our end.<br />Please contact support@united.vote and help us fix it.` }
    })
  }
  render() {
    const { error } = this.state
    const sign_in_email = this.storage.get('sign_in_email')
    const { query } = this.location

    return this.html`
      <section class="section">
        <div class="container has-text-centered">
          <h1 class="title">We emailed you a one-time code to sign in</h1>
          ${query.notification === 'resent_code' ? ['<div class="notification">We sent you a new one-time sign in code.</div>'] : ''}
          <div class="level">
            <div class="level-item">
              <form onsubmit=${this} action=${this} class="box" method="POST">
                <div class="field">
                  <label for="totp">Enter the one-time code<br/> we emailed <strong>${sign_in_email || 'you'}</strong>:</label>
                </div>
                <div class="field has-addons">
                  <div class="control is-expanded has-icons-left has-icons-right">
                    <input name="totp" class="${`input ${error ? 'is-danger' : ''}`}" type="text" placeholder="123 456" />
                    <span class="icon is-small is-left">
                      <i class="fa fa-unlock-alt"></i>
                    </span>
                    ${error ? [`<span class="icon is-small is-right">
                      <i class="fa fa-warning"></i>
                    </span>`] : ''}
                    ${error ? [`<p class="help is-danger">${error}</p>`] : ''}
                  </div>
                  <div class="control">
                    <button class="button is-primary" type="submit"><strong>Enter</strong></button>
                  </div>
                </div>
                <div class="content has-text-left is-size-7 has-text-grey">
                  <p class="has-text-grey">Didn't receive it? It may take a minute.<br />Be sure to check your spam/junk folder.</p>
                  <p><a onclick=${this} href="/sign_in">Send a new code</a></p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    `
  }
}
