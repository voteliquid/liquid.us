const Component = require('./Component')

module.exports = class EditProfilePage extends Component {
  oninit() {
    if (!this.state.user || !this.state.user.username) {
      this.location.redirect('/sign_in')
    }
  }

  onpagechange(oldProps) {
    if (oldProps.url !== this.props.url && (!this.state.user || !this.state.user.username)) {
      this.location.redirect('/sign_in')
    }
  }

  render() {
    return this.html`${this.state.user ? EditProfile.for(this) : ''}`
  }
}

class EditProfile extends Component {
  onsubmit(event, formData) {
    if (event) event.preventDefault()

    const { user } = this.state
    const { about, intro_video_url } = formData

    this.setState({ loading_edit_profile: true })

    return this.api(`/users?select=id&id=eq.${user.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        about: about || null,
        intro_video_url: intro_video_url || null,
      }),
    })
    .then(() => this.setState({ error: null, loading_edit_profile: false }))
    .catch(error => {
      if (~error.message.indexOf('users_intro_video_url_check')) {
        this.setState({ loading_edit_profile: false, error: 'Invalid intro video URL. Enter the share URL (example: https://youtu.be/XMrRrzYXav8)' })
      } else {
        this.setState({ loading_edit_profile: false, error: error.message })
      }
    })
  }
  render() {
    const { config, error, loading_edit_profile, user } = this.state
    const { about = '', intro_video_url = '' } = user
    return this.html`
      <section class="section">
        <div class="container">
          <div class="columns">
            <div class="column">
              <h1 class="title">Edit Profile</h1>
            </div>
            <div class="column has-text-right has-text-left-mobile">
              <p><span class="icon"><i class="fa fa-users"></i></span> View your profile: <strong><a href="${`${config.WWW_URL}/${user.username}`}">united.vote/${user.username}</a></strong></p>
            </div>
          </div>
          <br />
          <form action=${this} method="POST" onsubmit=${this}>
            <div class="field">
              <label class="label">Intro Video</label>
              <div class="control">
                <input class="${`input ${error && ~error.indexOf('video') ? 'is-danger' : ''}`}" name="intro_video_url" type="text" placeholder="https://youtu.be/XMrRrzYXav8" value="${intro_video_url}" />
                ${[error && ~error.indexOf('video') ? `<p class="help is-danger">${error}</p>` : '<p class="help">YouTube or Vimeo share URL</p>']}
              </div>
            </div>
            <div class="field">
              <label class="label">Intro text</label>
              <div class="control">
                <input class="${`input ${error && ~error.indexOf('about') ? 'is-danger' : ''}`}" name="about" type="text" placeholder="A short introduction" value="${about}" />
              </div>
            </div>
            <button class="${`button is-primary ${loading_edit_profile ? 'is-loading' : ''}`}" disabled=${loading_edit_profile} type="submit">Save</button>
          </form>
          <br />
          <p class="is-size-7">
            <span class="icon"><i class="fa fa-envelope"></i></span> <a onclick=${this}>Reach out</a> if you'd like to change your username or display name.
          </p>
        </div>
      </section>
    `
  }
}

class EditOtherFieldsNotification extends Component {
  onclick(event) {
    if (event) event.preventDefault()
    return { isContactWidgetVisible: !this.state.isContactWidgetVisible }
  }
  render() {
    return this.html`
      <br />
      <p class="has-text-grey">
      </p>
    `
  }
}
