const { WWW_URL } = process.env
const { handleForm, html } = require('../helpers')

module.exports = (state, dispatch) => {
  const { error, forms, legislatures = [], loading, location, measures = {}, user } = state
  const measure = measures[location.params.shortId] || {}
  const form = forms.editMeasure || {}
  const { legislature_name, summary, title } = measure
  const auto_short_id = (form.title || title || '').toLowerCase().replace(/ /g, '-').replace(/[^A-z0-9-_]/g, '').slice(0, 32)
  const l1 = legislatures[0] || {}
  const l2 = legislatures[1] || {}
  const l3 = legislatures[2] || {}
  const l4 = legislatures[3] || {}
  const short_id = !forms.editMeasureShortId && !measure.short_id ? auto_short_id : (form.short_id || measure.short_id)

  return html`
    <form method="POST" onsubmit=${handleForm(dispatch, { type: 'measure:editFormSaved', oldShortId: measure.short_id })} onkeyup=${handleForm(dispatch, { type: 'measure:editFormChanged' })} onchange=${handleForm(dispatch, { type: 'measure:editFormChanged' })}>
      ${error ? html`<div class="notification is-danger">${error.message}</div>` : ''}
      <div class="${`field ${legislatures.length === 1 ? 'is-hidden' : ''}`}">
        <label for="short_id" class="label has-text-grey">Legislature</label>
        <div class="control">
          <div class="${`select ${l1 && l2 && l3 ? '' : 'is-hidden'}`}">
            <select name="legislature_id">
              <option value="${l1.id}" selected=${l1.abbr === legislature_name}>${l1.name}</option>
              <option value="${l2.id}" selected=${l2.abbr === legislature_name}>${l2.name}</option>
              <option value="${l3.id}" selected=${l3.abbr === legislature_name}>${l3.name}</option>
              ${legislatures[3] ? `<option value="${l4.id}" selected=${l4.abbr === legislature_name}>${l4.name}</option>` : ''}
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
          <textarea name="summary" autocomplete="off" class="textarea" rows="10" placeholder="A summary of your proposed bill." required value="${summary || ''}"></textarea>
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
