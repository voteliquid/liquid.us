const Component = require('./Component')
const JoinForm = require('./JoinForm')

module.exports = class Join extends Component {
  oninit() {
    if (this.state.user) {
      if (this.location.query.sms) {
        // If they followed an SMS signup link, update their account to include their phone number
        // Currently, the best way to do this is to simply request a TOTP with their email and phone number,
        // which handles the logic of merging orphan accounts created with that phone number.
        return this.api(`/rpc/request_email_totp`, {
          method: 'POST',
          body: JSON.stringify({
            email: this.state.user.email,
            phone_user_id: this.location.query.sms,
            device_desc: this.location.userAgent || 'Unknown',
            signup_channel: 'united.vote',
            cookie: this.storage.get('cookie') || '',
          }),
        })
        .then(() => {
          const proxy_to = this.location.query.proxy_to
          if (proxy_to) {
            return this.api('/delegations', {
              method: 'POST',
              headers: { Prefer: 'return=representation' }, // returns created delegation in response
              body: JSON.stringify({
                from_id: this.state.user.id,
                username: proxy_to,
                delegate_rank: 0,
              }),
            })
            .then((proxies) => {
              this.storage.set('proxied_user_id', proxies[0].to_id)
              this.storage.unset('proxying_user_id')
              this.location.redirect(303, `/${proxy_to}`)
            })
            .catch(error => {
              console.log(error)
              this.location.redirect('/')
            })
          }
          this.location.redirect('/')
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

      return this.location.redirect('/')
    }
  }
  onpagechange(oldProps) {
    if (oldProps.url !== this.props.url && this.state.user) {
      return this.location.redirect('/')
    }
  }
  render() {
    return this.html`
      <div>
        <section class="section">
          <div class="container">
            ${JoinForm.for(this)}
          </div>
        </section>
        <div class="hero">
          <div class="hero-body">
            <h3 class="subtitle is-4 has-text-centered">Sign up in less than 5 minutes:</h3>
            <div class="container is-centered"><div class="columns">
              <div class="column has-text-centered">
                <h4 class="title is-4">
                  <span class="has-text-grey-light">&#9312;</span><br /><br />
                  <i class="fa fa-users" aria-hidden="true"></i>
                  Proxying
                </a></h4>
                <p>Choose optional personal representatives so your values will always be counted.</p>
              </div>
              <div class="column has-text-centered">
                <h4 class="title is-4">
                  <span class="has-text-grey-light">&#9313;</span><br /><br />
                  <i class="fa fa-address-card-o" aria-hidden="true"></i>
                  Verification
                </h4>
                <p>Confirm your identity to ensure 1-person-1-vote.</p>
              </div>
              <div class="column has-text-centered">
                <h4 class="title is-4">
                  <span class="has-text-grey-light">&#9314;</span><br /><br />
                  <i class="fa fa-check-square-o" aria-hidden="true"></i>
                  Legislation
                </h4>
                <p>Vote directly on bills to hold your elected reps accountable.</p>
              </div>
            </div></div>
          </div>
        </div>
      </div>
    `
  }
}
