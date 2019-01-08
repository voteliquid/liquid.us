const Component = require('./Component')

module.exports = class EditStatusForm extends Component {
  onkeyup(event) {
    this.setProps({ [event.target.getAttribute('name')]: event.target.value }).render()
  }
  onchange(event) {
    this.setProps({ [event.target.getAttribute('name')]: event.target.value }).render()
  }
  onsubmit(event, form) {
    event.preventDefault()
    return this.updateStatus(event, form)

  }
  updateStatus(event, form) {
    const { updating_last_action, measure } = this.state
    this.setState({ loading: 'saving' })
    const url = `${measure.author_username ? `/${measure.author_username}/` : '/'}${measure.type === 'PN' ? 'nominations' : 'legislation'}/${measure.short_id}`

    return this.api(`/measures?id=eq.${updating_last_action.id}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(form),
    })
    .then((actions) => {
      const action = actions[0]
      this.setState({
        loading: false,
        yourUpdate: (this.state.yourUpdate || []).map((old) => (old.id === updating_last_action.id ? action : old)),
      })
 this.location.redirect(303, `${url}`)

    })
    .catch((api_error) => this.handleError(api_error))
  }
  handleError(api_error) {
    let ui_error
    switch (api_error.message) {
      default:
        console.log(api_error)
        this.setState({ isContactWidgetVisible: true })
        ui_error = 'An error on our end occurred. Please contact support.'
    }
    this.setState({ loading: false, error: ui_error })
  }
  render() {
    const { updating_last_action = {}, error, loading } = this.state
    const { actions } = updating_last_action
    const action = actions[0]


    return this.html`
      <form method="POST" onsubmit=${this} action=${this}>
        ${error ? [`<div class="notification is-danger">${error}</div>`] : ''}
        <div class="field">
          <label for="Title" class="label has-text-grey">Status</label>
          <div class="control">
            <input name="" class="input" type="text" autocomplete="off" placeholder="${action}" onkeyup=${this} onchange=${this} required value="${action || ''}" />
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
