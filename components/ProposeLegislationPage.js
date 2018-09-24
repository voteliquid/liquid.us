const Component = require('./Component')
const EditLegislationForm = require('./EditLegislationForm')
const PublicProfileRequiredMsg = require('./PublicProfileRequiredMsg')

module.exports = class ProposeLegislationPage extends Component {
  oninit() {
    const { user } = this.state

    if (!user) return this.location.redirect('/sign_in?notification=propose-legislation')

    this.setState({ editing_bill: {}, error: false })
  }
  onpagechange(oldProps) {
    if (this.props.url !== oldProps.url) return this.oninit()
  }
  render() {
    const { user } = this.state

    return this.html`
      <section class="section">
        <div class="container is-widescreen">
          <h2 class="title is-5">Propose New Legislation</h2>
          ${user.username ? EditLegislationForm.for(this) : PublicProfileRequiredMsg.for(this)}
        </div>
      </section>
    `
  }
}
