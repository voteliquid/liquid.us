const Component = require('./Component')

module.exports = class ReportComment extends Component {
  onsubmit(event, form) {
    event.preventDefault()

    const { loading, user } = this.state
    const { comment } = this.props

    if (!loading) {
      this.api('/reports', {
        method: 'POST',
        body: JSON.stringify({
          reporter_id: user.id,
          comment_author_id: comment.user_id,
          comment_id: comment.id,
          explanation: form.explanation,
        }),
      })
      .then(() => this.location.redirect(303, this.location.path))
      .catch((report_error) => {
        if (report_error.status === 409) {
          this.setProps({ report_error: 'You already reported this comment.' }).render(this.props)
        } else {
          this.setProps({ report_error: 'An error occurred. Try again and contact support@liquid.us if you still have problems.' }).render(this.props)
        }
      })
    }
  }
  render() {
    const { loading } = this.state
    const { report_error } = this.props
    const commGuidelines = 'The spirit of this community is one of honesty and tolerance for other viewpoints. We strive to make this a place for expressing and discussing nuanced opinion. There is no place here for violence or its threat.'
    const commQuestion = 'Do you believe this comment should be reported?'
    return this.html`
      <div class="columns is-centered">
        <div class="column is-two-thirds-tablet is-one-half-desktop has-text-centered">
          <h2 class="title has-text-weight-normal is-4"><span>Report this comment?</span></h2>
          ${report_error ? [`<div class="notification is-warning">${report_error}</div>`] : ''}
          ${commGuidelines}
          <br><br>
          <form method="POST" onsubmit=${this} action=${this}>
            <div class="field">
              <label for="explanation" class="label hidden has-text-grey">${commQuestion}<br></label>
              <div class="control">
                <textarea name="explanation" autocomplete="off" class="textarea" rows="3" required placeholder="Add an explanation (optional)."></textarea>
              </div>
            </div>
            <div class="field is-grouped">
              <div class="control">
                <button class=${`button is-primary ${loading ? 'is-loading' : ''}`} disabled="${loading}" type="submit">
                  <span>Submit</span>
                </button>
              </div>
              <div class="control">
                <a href="${this.location.path}" class="button">Cancel</a>
              </div>
            </div>
          </form>
        </div>
      </div>
    `
  }
}
