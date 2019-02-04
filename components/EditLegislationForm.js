const Component = require('./Component')

module.exports = class EditLegislationForm extends Component {
  onkeyup(event) {
    this.setProps({ [event.target.getAttribute('name')]: event.target.value }).render()
  }
  onchange(event) {
    this.setProps({ [event.target.getAttribute('name')]: event.target.value }).render()
  }
  onsubmit(event, form) {
    event.preventDefault()

    const { editing_bill, loading } = this.state

    if (!loading) {
      if (editing_bill.id) {
        return this.updateLegislation(event, form)
      }
      return this.insertLegislation(event, form)
    }
  }
  insertLegislation(event, form) {
    const { user } = this.state

    this.setState({ loading: 'saving' })

    return this.api('/measures', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        author_id: user.id,
        legislature_id: form.legislature_id,
        title: form.title,
        summary: form.summary,
        published: false,
        chamber: 'Lower',
        type: 'bill',
        short_id: form.short_id,
      })
    })
    .then((bills) => {
      event.target.reset()

      const proposed_bill = bills[0]

      this.setState({
        editing_bill: {},
        loading: false,
        yourLegislation: [proposed_bill].concat(this.state.yourLegislation || []),
      })
    })
    .then(() => this.location.redirect(303, `/legislation/yours`))
    .catch((api_error) => this.handleError(api_error))
  }
  updateLegislation(event, form) {
    const { editing_bill, user } = this.state

    this.setState({ loading: 'saving' })

    return this.api(`/measures?id=eq.${editing_bill.id}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(form),
    })
    .then((bills) => {
      const bill = bills[0]
      this.setState({
        loading: false,
        yourLegislation: (this.state.yourLegislation || []).map((old) => (old.id === editing_bill.id ? bill : old)),
      })
      this.location.redirect(303, `/${user.username}/legislation/${bill.short_id}`)
    })
    .catch((api_error) => this.handleError(api_error))
  }
  handleError(api_error) {
    let ui_error
    switch (api_error.message) {
      case 'new row for relation "measures" violates check constraint "short_id_length"':
        ui_error = 'URL ID must be between 2 and 32 characters.'
        break
      case 'duplicate key value violates unique constraint "legislation_unique"':
        ui_error = 'There is already a bill with this title. Please choose another.'
        break
      default:
        console.log(api_error)
        this.setState({ isContactWidgetVisible: true })
        ui_error = 'An error on our end occurred. Please contact support.'
    }
    this.setState({ loading: false, error: ui_error })
  }
  render() {
    const { config, editing_bill = {}, error, legislatures = [], loading } = this.state
    const { WWW_URL } = config
    const { legislature_name, summary, title } = editing_bill
    const { short_id } = this.props
    const auto_short_id = (this.props.title || title || '').toLowerCase().replace(/ /g, '-').replace(/[^A-z0-9-_]/g, '').slice(0, 32)
    const l1 = legislatures[0] || {}
    const l2 = legislatures[1] || {}
    const l3 = legislatures[2] || {}

    return this.html`
      <form method="POST" onsubmit=${this} action=${this}>
        ${error ? [`<div class="notification is-danger">${error}</div>`] : ''}
        <div class="${`field ${legislatures.length === 1 ? 'is-hidden' : ''}`}">
          <label for="short_id" class="label has-text-grey">Legislature</label>
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
        <div class="field">
          <label for="Title" class="label has-text-grey">Title</label>
          <div class="control">
            <input name="title" class="input" type="text" autocomplete="off" placeholder="The Liquid Democracy Act of 2019" onkeyup=${this} onchange=${this} required value="${title || ''}" />
          </div>
        </div>
        <div class="field">
          <label for="short_id" class="label has-text-grey">URL</label>
          <div class="field has-addons">
            <div class="control">
              <a class="button is-static">${WWW_URL.replace(/https?:\/\//, '')}/legislation/</a>
            </div>
            <div class="control">
              <input name="short_id" class="input" type="text" placeholder="your-proposed-bill" onchange=${this} value="${!short_id || auto_short_id === short_id ? auto_short_id : short_id}" />
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
            <button class=${`button is-primary ${loading === 'saving' ? 'is-loading' : ''}`} disabled="${loading}" type="submit">
              <span class="icon"><i class="fa fa-edit"></i></span>
              <span>Save</span>
            </button>
          </div>
        </div>
      </form>
    `
  }
}
