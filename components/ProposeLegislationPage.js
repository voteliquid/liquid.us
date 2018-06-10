const Component = require('./Component')

module.exports = class ProposeLegislationPage extends Component {
  onsubmit(event) {
    event.preventDefault()

    this.setState({ saving: true })

    // TODO: API
    setTimeout(() => {
      this.setState({ saving: false })
      this.location.redirect(303, '/legislation/proposed/yours')
    }, 1000)
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
                  <input name="title" class="input" type="text" placeholder="The Liquid Democracy Act of 2018" required />
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
