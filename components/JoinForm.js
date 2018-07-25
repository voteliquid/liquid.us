const Component = require('./Component')
const SignIn = require('./SignIn')

module.exports = class JoinForm extends Component {
  oninit() {
    // If they got here from attempting to proxy from profile page
    return Promise.resolve(this.fetchProxyingProfile()).then(() => this.fetchSignupMetrics())
  }
  onclick(event) {
    event.preventDefault()
    return { isContactWidgetVisible: !this.state.isContactWidgetVisible }
  }
  onsubmit(event, formData) {
    return SignIn.prototype.onsubmit.call(this, event, formData)
  }
  fetchProxyingProfile() {
    const proxying_user_id = this.storage.get('proxying_user_id')
    const proxying_username = this.location.query.proxy_to
    if (proxying_user_id) {
      return this.api(`/user_profiles?select=user_id,first_name,last_name&user_id=eq.${proxying_user_id}`)
        .then(users => this.setState({ req_proxy_profile: users[0] }))
    }
    if (proxying_username) {
      return this.api(`/user_profiles?select=user_id,first_name,last_name&username=eq.${proxying_username}`)
        .then(users => {
          this.storage.set('proxying_user_id', users[0].user_id)
          this.setState({ req_proxy_profile: users[0] })
        })
    }
  }
  fetchSignupMetrics() {
    const { show_title } = this.props
    const { users_count } = this.state
    if (!users_count && show_title !== false) {
      return this.api('/metrics?select=users_count')
        .then((metrics) => this.setState({ users_count: metrics[0] ? metrics[0].users_count : 0 }))
        .catch(() => this.setState({ users_count: 0 }))
    }
  }
  render() {
    const { config, email, error, req_proxy_profile, users_count } = this.state
    const { APP_NAME } = config
    const { show_title } = this.props
    const { query } = this.location
    const proxy_to = this.storage.get('proxying_user_id') || this.location.query.proxy_to
    const vote_position = this.storage.get('vote_position')

    return this.html`
      <div>
        ${proxy_to && req_proxy_profile ? [`
          <div class="notification has-text-centered is-info">
            Join ${APP_NAME} to proxy to ${req_proxy_profile.first_name} ${req_proxy_profile.last_name}.
          </div>
        `] : []}
        ${vote_position ? [`
          <div class="notification has-text-centered is-info">Enter your email to save your vote and hold your representatives accountable.</div>
        `] : []}
        ${query.notification === 'rep_not_found' ? [`
          <div class="notification has-text-centered is-info">We could not automatically locate your representative. Join ${APP_NAME} to set your address.</div>
        `] : []}
        ${show_title !== false ? [`
          <h2 class="title has-text-centered">
            ${users_count
              ? `Join ${users_count} people for healthier democracy`
              : `Join for healthier democracy`
            }
          </h2>
          <br />
          `] : ''}

        <style>.center-on-small-widths { display: flex; }</style>
        <div class="columns is-centered center-on-small-widths">
          <div class="column" style="max-width: 500px;">
            <form class="box has-text-centered" method="POST" onsubmit=${this} action=${this}>
              <input name="phone_user_id" type="hidden" value="${this.location.query.sms || ''}" />

              <div class="field">
                <label for="email">Enter your email to get started:</label>
              </div>
              <style>
                .join-input-field {
                  margin: 30px 0 !important;
                }
              </style>

              <div class="field has-addons join-input-field">
                <div class="${`control is-expanded has-icons-left ${error ? 'has-icons-right' : ''}`}">
                  <input name="email" class="${`input ${error ? 'is-danger' : ''}`}" type="text" placeholder="you@example.com" value=${email || ''} />
                  <span class="icon is-small is-left">
                    <i class="fa fa-user"></i>
                  </span>
                  ${error ? [`<span class="icon is-small is-right">
                    <i class="fa fa-warning"></i>
                  </span>`] : ''}
                  ${error ? [`<p class="help is-danger">This email is invalid</p>`] : ''}
                </div>
                ${/* use shorter submit button text for small screens */''}
                <div class="control">
                  <div class="is-hidden-touch">
                    <button class="button is-info" type="submit"><strong>Create Account</strong></button>
                  </div>
                  <div class="is-hidden-desktop">
                    <button class="button is-info" type="submit"><strong>Join</strong></button>
                  </div>
                </div>
              </div>

              <div class="content">
                <p>
                  <span class="icon is-small has-text-grey-lighter">
                    <i class="fa fa-lock"></i>
                  </span>
                  No need to choose a password &mdash; one less thing to forget or have compromised.
                </p>
                <p class="has-text-grey is-size-7">We will never share your email with anyone.</p>
              </div>
            </form>
          </div>
        </div>
      </div>
    `
  }
}
