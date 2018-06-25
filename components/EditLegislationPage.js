const Component = require('./Component')

module.exports = class EditLegislationPage extends Component {
  oninit() {
    if (!this.state.user) {
      this.location.redirect('/sign_in')
    }

    return this.fetchData()
  }
  onpagechange(oldProps) {
    if (this.props.url !== oldProps.url) return this.fetchData()
  }
  fetchData() {
    this.setState({ editing_bill: null, loading: true })
    return this.fetchLegislatures().then(() => this.fetchLegislation()).then(() => this.setState({ loading: false }))
  }
  fetchLegislation() {
    const { editing_bill, user } = this.state
    const { params } = this.props
    return this.api(`/legislation_detail?author_id=eq.${user.id}&${editing_bill ? `id=eq.${editing_bill.id}` : `short_id=eq.${params.short_id}`}`)
      .then((legislation) => {
        if (legislation[0] && legislation[0].published) {
          return this.location.redirect(302, `/legislation/${legislation[0].short_id}`)
        }
        return this.setState({ editing_bill: legislation[0] })
      })
  }
  fetchLegislatures() {
    const { reps } = this.state
    return this.api('/legislatures').then(legislatures => this.setState({
      legislatures: legislatures.filter(({ short_name }) => {
        return short_name === 'US-Congress' || reps.some(({ office_short_name }) => {
          return short_name.slice(0, 2) === office_short_name.slice(0, 2)
        })
      })
    }))
  }
  onclick(event) {
    event.preventDefault()
    const confirmed = window.confirm(`Are you sure you want to publish? Once your legislation is published it will be public, and you will no longer be able to edit it.`)
    if (confirmed) {
      document.querySelector('input[name="published"]').value = 'true'
      document.querySelector('button[type="submit"]').click()
    }
  }
  onkeyup(event) {
    this.setProps({ [event.target.getAttribute('name')]: event.target.value }).render()
  }
  onchange(event) {
    this.setProps({ [event.target.getAttribute('name')]: event.target.value }).render()
  }
  onsubmit(event, form) {
    event.preventDefault()

    this.setState({ saving: true })

    return this.api(`/legislation?id=eq.${this.state.editing_bill.id}`, {
      method: 'PATCH',
      headers: {
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        author_id: this.state.user.id,
        legislature_id: form.legislature_id,
        title: form.title,
        summary: form.summary,
        published: form.published === 'true',
        chamber: 'Lower',
        type: 'HR',
        short_id: form.short_id,
      })
    })
    .then(() => {
      this.setState({ saving: false })
      this.location.redirect(303, '/legislation/proposed/yours')
    })
    .catch((api_error) => this.handleError(api_error))
  }
  handleError(api_error) {
    let ui_error
    switch (api_error.message) {
      case 'new row for relation "legislation" violates check constraint "short_id_length"':
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
    this.setState({ saving: false, error: ui_error })
  }
  render() {
    const { config, editing_bill: l = {}, error, legislatures = [], saving } = this.state
    const { short_id } = this.props
    const auto_short_id = (this.props.title || l.title || '').toLowerCase().replace(/ /g, '-').replace(/[^A-z0-9-_]/g, '').slice(0, 32)

    return this.html`
      <section class="section">
        <div class="container">
          <h2 class="title is-5">Edit Draft Legislation</h2>
          <div class="content">
            <form id="edit_legislation" method="POST" onsubmit=${this} action=${this}>
              <p class="notification">You can continue to edit until you publish and make your proposed legislation public.</p>
              ${error ? [`<div class="notification is-danger">${error}</div>`] : ''}
              <div class="${`field ${legislatures.length === 1 ? 'is-hidden' : ''}`}">
                <label for="short_id" class="label has-text-grey">Legislature</label>
                <div class="control">
                  <div class="select">
                    <select name="legislature_id">
                      ${legislatures.map(({ id, name }) => {
                        return `<option value="${id}" ${name === l.legislature_name ? 'selected' : ''}>${name}</option>`
                      })}
                    </select>
                  </div>
                </div>
              </div>
              <div class="field">
                <label for="Title" class="label has-text-grey">Title</label>
                <div class="control">
                  <input name="title" class="input" type="text" autocomplete="off" placeholder="The Liquid Democracy Act of 2018" onkeyup=${this} onchange=${this} required value="${l.title || ''}" />
                </div>
              </div>
              <div class="field">
                <label for="short_id" class="label has-text-grey">URL</label>
                <div class="field has-addons">
                  <div class="control">
                    <a class="button is-static">${config.WWW_URL.replace(/https?:\/\//, '')}/legislation/</a>
                  </div>
                  <div class="control">
                    <input name="short_id" class="input" type="text" placeholder="your-proposed-bill" onchange=${this} value="${!short_id || auto_short_id === short_id ? auto_short_id : short_id}" />
                  </div>
                </div>
              </div>
              <div class="field">
                <label for="summary" class="label has-text-grey">Summary</label>
                <div class="control">
                  <textarea name="summary" autocomplete="off" class="textarea" rows="10" placeholder="A summary of your proposed bill." required value="${l.summary}"></textarea>
                  <p class="help">You can continue to edit your proposed bill later.</p>
                </div>
              </div>
              <input name="published" type="hidden" value="false" />
              <div class="field is-grouped">
                <div class="control">
                  <button class=${`button is-primary ${saving ? 'is-loading' : ''}`} disabled="${saving}" type="submit">
                    <span class="icon"><i class="fa fa-pencil-square-o"></i></span>
                    <span>Save</span>
                  </button>
                </div>
                <div class="control">
                  <button class=${`button ${saving ? 'is-loading' : ''}`} disabled="${saving}" onclick="${this}">
                    <span class="icon"><i class="fa fa-check"></i></span>
                    <span>Publish</span>
                  </button>
                </div>
              </div>
            </form>
            <br />
          </div>
        </div>
      </section>
    `
  }
}
