const { WWW_URL, WWW_DOMAIN } = process.env
const { handleForm, html } = require('../helpers')

module.exports = ({ error, loading, user, forms: { profile: profileForm = {} } }, dispatch) => {
  const about = user.about || ''
  const intro_video_url = user.intro_video_url || ''
  const remaining_chars = 1024 - (profileForm.about || about).length
  const formChanged = typeof profileForm.about === 'string' && (user.about !== profileForm.about || user.intro_video_url !== profileForm.intro_video_url)
  return html`
    <section class="section">
      <div class="container is-widescreen">
        <h2 class="title is-5">Edit Profile</h2>
        <form method="POST" onsubmit=${handleForm(dispatch, { type: 'profile:userProfileSaved', user })} onkeyup=${handleForm(dispatch, { type: 'profile:userProfileFormChanged' })}>
          <div class="field">
            <label class="label">Intro Video</label>
            <div class="control">
              <input class="${`input ${error && ~error.message.indexOf('video') ? 'is-danger' : ''}`}" name="intro_video_url" type="text" placeholder="https://youtu.be/XMrRrzYXav8" value="${intro_video_url}" />
              ${error && ~error.message.indexOf('video') ? html`<p class="help is-danger">${error}</p>` : html`<p class="help">YouTube or Vimeo share URL</p>`}
            </div>
          </div>
          <div class="field">
            <label class="label">Intro text</label>
            <div class="control">
              <textarea class="${`textarea ${error && ~error.message.indexOf('bio') ? 'is-danger' : ''}`}" name="about" placeholder="A short introduction" value="${about}"></textarea>
              ${error && ~error.message.indexOf('bio') ? html`<p class="help is-danger">Your introduction is too long. Introductions cannot be longer than 1024 characters.</p>` : ''}
              <p class="help">A short introduction or bio. Characters remaining: ${remaining_chars > 0 ? remaining_chars : 0}</p>
            </div>
          </div>
          <button class="${`button is-primary ${loading.userProfile ? 'is-loading' : ''}`}" disabled=${!formChanged} type="submit">${formChanged ? 'Save' : 'Saved'}</button>
        </form>
        <br />
        <p>View your profile at <strong><a href="${`${WWW_URL}/${user.username}`}">${WWW_DOMAIN}/${user.username}</a></strong></p>
        <p class="has-text-grey">
          <a onclick=${(event) => dispatch({ type: 'contactForm:toggled', event })}>Reach out</a> if you'd like to change your username or display name.
        </p>
      </div>
    </section>
  `
}
