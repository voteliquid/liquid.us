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

    const { editing_bill, loading } = this.state

    if (!loading) {
      if (editing_bill.id) {
        return this.updateStatus(event, form)
      }
    }
  }
  updateStatus(event, form) {
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
        yourUpdate: (this.state.yourUpdate || []).map((old) => (old.id === editing_bill.id ? bill : old)),
      })
      this.location.redirect(303, `/${user.username}/legislation/${bill.short_id}`)
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
    const { editing_bill = {}, error, loading } = this.state
    const { status } = editing_bill


    return this.html`
      <form method="POST" onsubmit=${this} action=${this}>
        ${error ? [`<div class="notification is-danger">${error}</div>`] : ''}
        <div class="field">
          <label for="Title" class="label has-text-grey">Status</label>
          <div class="control">
            <input name="status" class="input" type="text" autocomplete="off" placeholder="${status}" onkeyup=${this} onchange=${this} required value="${status || ''}" />
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
