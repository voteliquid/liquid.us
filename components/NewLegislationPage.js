const Component = require('./Component')

module.exports = class NewLegislationPage extends Component {
  onsubmit(event, form) {
    event.preventDefault()

    const { user } = this.state

    if (!form.title) {
      return { error: 'You must choose a title. (You can edit later)' }
    }

    this.setState({ saving: true })

    return this.api('/new_legislation', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        author_id: user.id,
        title: form.title,
        description: form.description,
      }),
    })
    .then(() => {
      this.setState({ saving: false })
      return this.location.redirect(303, '/legislation/new/yours')
    })
    .catch(error => {
      return { error: error.message, saving: false }
    })
  }
  render() {
    const { error, saving } = this.state
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
                  <input name="title" class="input" type="text" placeholder="The Voting Rights Act of 1965">
                </div>
              </div>
              <div class="field">
                <label for="description" class="label has-text-grey">Description:</label>
                <div class="control">
                  <textarea name="description" autocomplete="off" class="textarea" rows="10" placeholder="You can continue to edit."></textarea>
                </div>
              </div>
              <div class="field is-pulled-right">
                <div class="control">
                  <button class=${`button is-primary ${saving ? 'is-loading' : ''}`} type="submit">
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
