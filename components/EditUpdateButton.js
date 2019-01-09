const Component = require('./Component')

module.exports = class EditUpdateButton extends Component {
  render() {
    return this.html`
      <div class="buttons has-addons is-right">
        ${UpdateButton.for(this, this.props)}
      </div>
    `
  }
}

class UpdateButton extends Component {
  render() {
    const { user } = this.state
    const { short_id } = this.props
    if (user) {
    return this.html`
      <a href="${`/${user.username}/legislation/${short_id}/update`}" class="button is-small">
        <span class="icon is-small"><i class="fa fa-pencil-alt"></i></span><span>Update Status</span>
      </a>

    `
  }
  }
}
