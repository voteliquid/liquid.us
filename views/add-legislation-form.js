const { WWW_URL } = process.env
const { handleForm, html } = require('../helpers')

module.exports = (state, dispatch) => {
  const { error, forms, legislatures = [], location, measures = {}, user } = state
  const measure = measures[location.params.shortId] || {}
  const form = forms.editMeasure || {}
  const { legislature_name, title } = measure
  const auto_short_id = (form.title || title || '').toLowerCase().replace(/ /g, '-').replace(/[^A-z0-9-_]/g, '').slice(0, 32)
  const l1 = legislatures[0] || {}
  const l2 = legislatures[1] || {}
  const l3 = legislatures[2] || {}
  const short_id = !forms.editMeasureShortId && !measure.short_id ? auto_short_id : (form.short_id || measure.short_id)

  return html`
    <form method="POST" onsubmit=${handleForm(dispatch, { type: 'measure:editFormSaved' })}>
      ${error ? html`<div class="notification is-danger">${error.message}</div>` : ''}
      <div class="card">
        <div class="card-content">
          <div class="field">
            <div class="control">
              <input name="title" class="input" type="text" autocomplete="off" placeholder="Create a specific policy change that you want to see happen" required value="${title || ''}" />
            </div>
          </div>
          <div class="columns is-mobile has-text-right">
            <div class="column">
              <span class="field is-hidden">
                <label for="short_id" class="label has-text-grey">URL</label>
                <span class="field has-addons">
                  <span class="control">
                    <a class="button is-static">${WWW_URL.replace(/https?:\/\//, '')}/${user.username}/</a>
                  </span>
                  <span class="control">
                    <input name="short_id" class="input" type="text" value="${short_id}" />
                  </span>
                </span>
              </span>
            </div>
            <div class="${`column ${legislatures.length === 1 ? 'is-hidden' : 'is-narrow'}`}">
              <label for="short_id" class="label has-text-grey">Choose legislature</label>
            </div>
            <div class="column is-narrow">
              <div class="field">
                <div class="control">
                  <div class="${`select ${l1 && l2 && l3 ? '' : 'is-hidden'}`}">
                    <select name="legislature_id">
                      <option value="${l1.id}" selected=${l1.abbr === legislature_name}>${l1.name}</option>
                      <option value="${l2.id}" selected=${l2.abbr === legislature_name}>${l2.name}</option>
                      <option value="${l3.id}" selected=${l3.abbr === legislature_name}>${l3.name}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div class="column is-narrow">
              <div class="field is-grouped">
                <div class="control">
                  <button class=${`button is-primary`} type="submit">
                    <span class="icon"><i class="fa fa-edit"></i></span>
                    <span>Save</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  `
}
