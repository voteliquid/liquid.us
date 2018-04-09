const Component = require('./Component')
const SignIn = require('./SignIn')

module.exports = class JoinForm extends Component {
  oninit() {
    // If they got here from attempting to proxy from profile page
    return Promise.resolve(this.fetchProxyingProfile()).then(() => this.fetchSignupMetrics())
  }
  onclick(event) {
    event.preventDefault()
    return { isFeedbackWindowVisible: !this.state.isFeedbackWindowVisible }
  }
  onsubmit(event, formData) {
    return SignIn.prototype.onsubmit.call(this, event, formData)
  }
  fetchProxyingProfile() {
    const proxying_user_id = this.storage.get('proxying_user_id')
    if (proxying_user_id) {
      return this.api(`/user_profiles?select=user_id,first_name,last_name&user_id=eq.${proxying_user_id}`)
        .then(users => this.setState({ req_proxy_profile: users[0] }))
    }
  }
  fetchSignupMetrics() {
    const { show_title } = this.props
    const { signup_metrics } = this.state
    if (!signup_metrics && show_title !== false) {
      return this.api('/metrics?metric=eq.join&order=period_begin.desc')
        .then(metrics => metrics.reduce((b, a) => {
          b.push({
            x: new Date(a.period_begin).getTime(),
            y: a.value,
          })
          return b
        }, []).reverse())
        .then(signup_metrics => this.setState({ signup_metrics }))
        .catch(() => this.setState({ signup_metrics: [] }))
    }
  }
  render() {
    const { config, email, error, req_proxy_profile, signup_metrics } = this.state
    const { APP_NAME } = config
    const { show_title } = this.props
    const { query } = this.location
    const proxying_user_id = this.storage.get('proxying_user_id')
    const vote_position = this.storage.get('vote_position')

    return this.html`
      <div>
        ${proxying_user_id && req_proxy_profile ? [`
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
          <h2 class="title has-text-centered reveal">
            ${signup_metrics && signup_metrics.length
              ? `Join ${signup_metrics[signup_metrics.length - 1].y} people for the future of democracy`
              : `Be a part of the future of democracy`
            }
          </h2>
          <br />
          `] : ''}

        <style>.center-on-small-widths { display: flex; }</style>
        <div class="columns is-centered center-on-small-widths">
          <div class="column is-narrow" style="max-width: 500px;">
            <form class="box has-text-centered" method="POST" onsubmit=${this} action=${this}>
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
