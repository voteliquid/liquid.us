const Component = require('./Component')

module.exports = class ProposeLegislationPage extends Component {
  oninit() {
    if (!this.state.user) {
      this.location.redirect('/sign_in')
    }

    return this.fetchLegislatures()
  }
  onpagechange(oldProps) {
    if (this.props.url !== oldProps.url) return this.fetchLegislatures()
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
  onsubmit(event, form) {
    event.preventDefault()

    this.setState({ saving: true })

    return this.api('/legislation', {
      method: 'POST',
      headers: {
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        author_id: this.state.user.id,
        legislature_id: form.legislature_id,
        title: form.title,
        summary: form.description,
        published: false,
        chamber: 'House',
        type: 'HR',
        short_id: form.title.toLowerCase().replace(/ /g, '-').replace(/[^A-z0-9-]/g, '').slice(0, 256),
      })
    })
    .then(() => {
      this.setState({ saving: false })
      this.location.redirect(303, '/legislation/proposed/yours')
    })
    .catch((api_error) => {
      console.log(api_error)
      let ui_error
      switch (api_error.message) {
        case 'duplicate key value violates unique constraint "legislation_unique"':
          ui_error = 'There is already a bill with this title. Please choose another.'
          break
        default:
          this.setState({ isContactWidgetVisible: true })
          ui_error = 'An error on our end occurred. Please contact support.'
      }
      this.setState({ saving: false, error: ui_error })
    })
  }
  render() {
    const { error, legislatures = [], saving } = this.state

    return this.html`
      <section class="section">
        <div class="container">
        <h2 class="title is-5">Propose New Legislation for the U.S.</h2>
          <div class="content">
            <form method="POST" onsubmit=${this} action=${this}>
              ${error ? [`<div class="notification is-danger">${error}</div>`] : ''}
              <div class="field">
                <label for="Title" class="label has-text-grey">Title:</label>
                <div class="control">
                  <input name="title" class="input" type="text" placeholder="The Liquid Democracy Act of 2018" onkeyup=${this} required />
                </div>
              </div>
              <div class="${`field ${legislatures.length === 1 ? 'is-hidden' : ''}`}">
                <label for="short_id" class="label has-text-grey">Legislature</label>
                <div class="control">
                  <div class="select">
                    <select name="legislature_id">
                      ${legislatures.map(({ id, name }) => {
                        return `<option value="${id}">${name}</option>`
                      })}
                    </select>
                  </div>
                </div>
              </div>
              <div class="field">
                <label for="description" class="label has-text-grey">Description:</label>
                <div class="control">
                  <textarea name="description" autocomplete="off" class="textarea" rows="10" placeholder="You can continue to edit." required></textarea>
                </div>
              </div>
              <div class="field is-pulled-right">
                <div class="control">
                  <button class=${`button is-primary ${saving ? 'is-loading' : ''}`} disabled="${saving}" type="submit">
                    <span class="icon"><i class="fa fa-pencil-square-o"></i></span>
                    <span>Save</span>
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
