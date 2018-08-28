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
  onkeyup(event) {
    if (event.target.tagName === 'TEXTAREA') {
      this.setState({ editing_form: true, about_length: event.target.value.length })
    } else {
      this.setState({ editing_form: true })
    }
  }
  onclick(event) {
    if (event) event.preventDefault()
    return { isContactWidgetVisible: !this.state.isContactWidgetVisible }
  }
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
    .then(() => this.setState({ editing_form: false, error: null, loading_edit_profile: false }))
    .catch(error => {
      if (~error.message.indexOf('users_intro_video_url_check')) {
        this.setState({ loading_edit_profile: false, error: 'Invalid intro video URL. Enter the share URL (example: https://youtu.be/XMrRrzYXav8)' })
      } else {
        this.setState({ loading_edit_profile: false, error: error.message })
      }
    })
  }
  render() {
    const { config, editing_form, error, loading_edit_profile, user } = this.state
    const about = user.about || ''
    const intro_video_url = user.intro_video_url || ''
    const about_length = typeof this.state.about_length === 'number' ? this.state.about_length : about.length
    const remaining_chars = 1024 - about_length
    return this.html`
      <section class="section">
        <div class="container is-widescreen">
          <nav class="breadcrumb has-succeeds-separator is-left is-small" aria-label="breadcrumbs">
            <ul>
              <li><a class="has-text-grey" href="/">${config.APP_NAME}</a></li>
              <li class="is-active"><a class="has-text-grey" href="#" aria-current="page">Edit Profile</a></li>
            </ul>
          </nav>
          <h2 class="title is-5">Edit Profile</h2>
          <form action=${this} method="POST" onsubmit=${this}>
            <div class="field">
              <label class="label">Intro Video</label>
              <div class="control">
                <input onkeyup=${this} class="${`input ${error && ~error.indexOf('video') ? 'is-danger' : ''}`}" name="intro_video_url" type="text" placeholder="https://youtu.be/XMrRrzYXav8" value="${intro_video_url}" />
                ${[error && ~error.indexOf('video') ? `<p class="help is-danger">${error}</p>` : '<p class="help">YouTube or Vimeo share URL</p>']}
              </div>
            </div>
            <div class="field">
              <label class="label">Intro text</label>
              <div class="control">
                <textarea onkeyup=${this} class="${`textarea ${error && ~error.indexOf('bio') ? 'is-danger' : ''}`}" name="about" placeholder="A short introduction" value="${about}"></textarea>
                ${[error && ~error.indexOf('bio') ? `<p class="help is-danger">Your introduction is too long. Introductions cannot be longer than 1024 characters.</p>` : '']}
                <p class="help">A short introduction or bio. Characters remaining: ${remaining_chars > 0 ? remaining_chars : 0}</p>
              </div>
            </div>
            <button class="${`button is-primary ${loading_edit_profile ? 'is-loading' : ''}`}" disabled=${!editing_form || loading_edit_profile} type="submit">${editing_form ? 'Save' : 'Saved'}</button>
          </form>
          <br />
          <p>View your profile at <strong><a href="${`${config.WWW_URL}/${user.username}`}">united.vote/${user.username}</a></strong></p>
          <p class="has-text-grey">
            <a onclick=${this}>Reach out</a> if you'd like to change your username or display name.
          </p>
        </div>
      </section>
    `
  }
}
