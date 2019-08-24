const { WWW_URL } = process.env
const { handleForm, html } = require('../helpers')
const activityIndicator = require('./activity-indicator')
const editPetitionPage = require('./edit-petition-page')

module.exports = (state, dispatch) => {
  const { location, measures = {}, user } = state
  const measure = location.params.shortId && measures[location.params.shortId]

  if (measure && measure.type === 'petition') {
    return editPetitionPage(state, dispatch)
  }

  return html`
    <section class="section">
      <div class="container is-widescreen">
        <h2 class="title is-5">${measure ? 'Edit Legislation' : 'Propose New Legislation'}</h2>
        ${user.username
          ? location.params.shortId && !measure
            ? activityIndicator()
            : form(state, dispatch)
          : publicProfileRequiredMsg(user.phone_verified)}
      </div>
    </section>
  `
}

const publicProfileRequiredMsg = (verified) => {
  return html`
    <p class="notification">
      You must create a public profile to propose legislation.
      ${verified
        ? html`<a href="/get_started">Choose a username</a> and make a public profile.</a>`
        : html`<a href="/get_started">Verify your phone number</a> to choose a username and make a public profile.</a>`
      }
    </p>
  `
}

const form = (state, dispatch) => {
  const { error, forms, legislatures = [], loading, location, measures = {}, user } = state
  const measure = measures[location.params.shortId] || {}
  const form = forms.editMeasure || {}
  const { legislature_id, summary, title } = measure
  const auto_short_id = (form.title || title || '').toLowerCase().replace(/ /g, '-').replace(/[^A-z0-9-_]/g, '').slice(0, 32)
  const short_id = !forms.editMeasureShortId && !measure.short_id ? auto_short_id : (form.short_id || measure.short_id)

  return html`
    <form method="POST" onsubmit=${handleForm(dispatch, { type: 'measure:editFormSaved', oldShortId: measure.short_id })} onkeyup=${handleForm(dispatch, { type: 'measure:editFormChanged' })} onchange=${handleForm(dispatch, { type: 'measure:editFormChanged' })}>
      ${error ? html`<div class="notification is-danger">${error.message}</div>` : ''}
      <input type="hidden" name="measure_type" value="bill" />
      <div class="${`field ${legislatures.length === 1 ? 'is-hidden' : ''}`}">
        <label for="short_id" class="label has-text-grey">Legislature</label>
        <div class="control">
          <div class="select">
            <select name="legislature_id">
              ${legislatures.map(({ id, name }) => {
                return html`<option value="${id}" selected=${id === legislature_id}>${name}</option>`
              })}
            </select>
          </div>
        </div>
      </div>
      <div class="field">
        <label for="Title" class="label has-text-grey">Title</label>
        <div class="control">
          <input name="title" class="input" type="text" autocomplete="off" placeholder="The Liquid Democracy Act of 2019" required value="${title || ''}" />
        </div>
      </div>
      <div class="field">
        <label for="short_id" class="label has-text-grey">URL</label>
        <div class="field has-addons">
          <div class="control">
            <a class="button is-static">${WWW_URL.replace(/https?:\/\//, '')}/${user.username}/</a>
          </div>
          <div class="control">
            <input name="short_id" class="input" type="text" placeholder="your-proposed-bill" onkeyup=${editedShortId(dispatch)} onchange=${editedShortId(dispatch)} value="${short_id}" />
          </div>
        </div>
      </div>
      <div class="field">
        <label for="summary" class="label has-text-grey">Summary</label>
        <div class="control">
          <textarea name="summary" autocomplete="off" class="textarea" rows="4" placeholder="A short summary of your proposed bill." required value="${summary || ''}"></textarea>
          <p class="help">You can continue to edit your proposed bill later.</p>
        </div>
      </div>
      <div class="field is-grouped">
        <div class="control">
          <button class=${`button is-primary ${loading.editMeasure === 'saving' ? 'is-loading' : ''}`} disabled="${loading.editMeasure}" type="submit">
            <span class="icon"><i class="fa fa-edit"></i></span>
            <span>Save</span>
          </button>
        </div>
      </div>
    </form>
  `
}

const editedShortId = (dispatch) => (event) => {
  dispatch({ type: 'measure:editFormShortIdChanged', shortId: event.currentTarget.value, event })
}
