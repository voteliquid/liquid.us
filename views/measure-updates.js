const { WWW_URL } = process.env
const { handleForm, html, linkifyUrls } = require('../helpers')
const { icon } = require('@fortawesome/fontawesome-svg-core')
const { faPencilAlt } = require('@fortawesome/free-solid-svg-icons/faPencilAlt')
const { faTrash } = require('@fortawesome/free-solid-svg-icons/faTrash')

module.exports = (state, dispatch) => {
  const { loading, location, measures, user } = state
  const measure = measures[location.params.shortId]
  const { updates = [] } = measure
  const showUpdateForm = measure.showUpdateForm || location.query.show === 'update-form' || location.query.edit

  return html`
    <div>
      ${!showUpdateForm && user ? updateControls(measure, state, dispatch) : html``}
      ${showUpdateForm ? updateForm(measure, state, dispatch) : html``}
      ${!loading.updates && !updates.length ? noUpdatesView(state) : html``}
      ${!loading.updates && updates.length ? updates.map(updateView(measure, state, dispatch)) : html``}
    </div>
  `
}

const noUpdatesView = () => html`
  <p class="has-text-centered has-text-grey">No updates.</p>
`

const updateView = (measure, state, dispatch) => (update, idx) => {
  const { location, user } = state
  return html`
    <div class="content">
      ${idx ? html`<hr />` : html``}
      <p>
        <span class="has-text-grey has-text-uppercase">${new Date(update.created_at).toLocaleDateString()} &mdash;</span>
        ${{ html: linkifyUrls(update.message) }}
      </p>
      ${user && user.id === measure.author_id ? html`
        <div class="is-flex">
          <form method="GET" action="${location.url}" onsubmit=${handleForm(dispatch, state)}>
            <input type="hidden" name="edit" value="${update.id}" />
            <input type="hidden" name="tab" value="updates" />
            <button class="has-text-no-underline is-size-7 button is-text" type="submit">
              <span class="icon">${icon(faPencilAlt)}</span>
              <span>Edit</span>
            </button>
          </form>
          <form method="POST" action="${location.url}" onsubmit=${handleForm(dispatch, { type: 'measure:updateDeleted', measure })}>
            <input type="hidden" name="id" value="${update.id}" />
            <button class="has-text-no-underline is-size-7 button is-text" type="submit">
              <span class="icon">${icon(faTrash)}</span>
              <span>Delete</span>
            </button>
          </form>
        </div>
      ` : html``}
    </div>
  `
}

const updateControls = (measure, { location, user }, dispatch) => {
  const showUpdateForm = measure.showUpdateForm || location.query.show === 'update-form'
  return html`
    <div>
      <div class="columns">
        <form class="column" method="POST" action="${location.path}" onsubmit=${handleForm(dispatch, { type: 'measure:notificationsToggled', measure })}>
          <label class="checkbox">
            <input
              onchange=${() => dispatch({ type: 'measure:notificationsToggled', measure })}
              name="notifications"
              type="checkbox" checked=${measure.notifications}
            />
            Notify me of updates
          </label>
        </form>
        ${user.id === measure.author_id ? html`
          <div class="column has-text-right has-text-left-mobile">
            <a
              class="button"
              href="${`${WWW_URL}${location.path}?tab=updates${showUpdateForm ? '' : '&show=update-form'}`}"
              onclick=${(event) => dispatch({ type: 'measure:toggledUpdateForm', event, measure })}
            >
              Post an Update
            </a>
          </div>
        ` : html``}
      </div>
      <hr style="margin-top: 0;" />
    </div>
  `
}

const updateForm = (measure, { loading, location }, dispatch) => {
  const update = measure.updates.filter(({ id }) => id === location.query.edit)[0]
  const minUntilNotify = update ? Math.max(0, Math.floor(((new Date(`${update.created_at}Z`).getTime() + (30 * 60 * 1000)) - Date.now()) / 60000)) : 30
  return html`
    <form method="POST" action="${location.path}" onsubmit=${handleForm(dispatch, { type: 'measure:updateFormSubmitted', measure })}>
      <input type="hidden" name="id" value="${update ? update.id : ''}" />
      <h4 class="title is-6">${update ? 'Edit' : 'Post'} Update</h4>
      <div class="field">
        <div class="control">
          <textarea
            name="message"
            class="textarea"
            rows="2"
            placeholder="Announcement, amendment, or victory"
          >${update ? update.message : ''}</textarea>
        </div>
      </div>
      <div class="field">
        <div class="control">
          ${minUntilNotify > 1
          ? html`
              <label class="checkbox is-size-7">
                <input name="notify_voters" type="checkbox" checked=${update ? update.notify_voters : true} />
                Notify ${measure.type === 'petition' ? 'petition supporters' : 'measure voters'}.
                You${update ? '' : `'ll`} have ${minUntilNotify} minutes to edit or delete your update before ${measure.type === 'petition' ? 'petition supporters' : 'measure voters'} are notified.
              </label>
            `
          : html`
            <input type="hidden" name="notify_voters" value="${update ? update.notify_voters : ''}" />
          `}
        </div>
      </div>
      <div class="field">
        <button type="submit" disabled=${loading.form} class="${`button ${loading.form ? 'is-loading' : ''}`}">
          ${update ? 'Save' : 'Post Update'}
        </button>
        <a class="button has-text-grey has-text-no-underline is-text" href="${`${location.path}?tab=updates`}">
          Cancel
        </a>
      </div>
      <hr />
    </form>
  `
}
