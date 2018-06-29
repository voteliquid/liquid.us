const Component = require('./Component')
const EditLegislationForm = require('./EditLegislationForm')

module.exports = class ProposeLegislationPage extends Component {
  oninit() {
    const { legislatures, user, reps } = this.state

    if (!user) return this.location.redirect('/sign_in?notification=propose-legislation')

    this.setState({ editing_bill: {} })

    if (!legislatures) {
      this.setState({ loading: 'legislatures' })

      return this.api('/legislatures').then(legislatures => this.setState({
        legislatures: legislatures.filter(({ short_name }) => {
          return short_name === 'US-Congress' || reps.some(({ office_short_name }) => {
            return short_name.slice(0, 2) === office_short_name.slice(0, 2)
          })
        }),
        loading: false,
      }))
    }
  }
  onpagechange(oldProps) {
    if (this.props.url !== oldProps.url) return this.oninit()
  }
  render() {
    const { user } = this.state

    return this.html`
      <section class="section">
        <div class="container">
          <h2 class="title is-5">Propose New Legislation</h2>
          ${user.username ? EditLegislationForm.for(this) : PublicProfileRequiredMsg.for(this)}
        </div>
      </section>
    `
  }
}

class PublicProfileRequiredMsg extends Component {
  render() {
    const { user } = this.state
    return this.html`
      <p class="notification">
        You must create a public profile to propose legislation.
        ${[user.cc_verified
          ? `<a href="/get_started">Choose a username</a> and make a public profile.</a>`
          : `<a href="/get_started">Verify your identity</a> to choose a username and make a public profile.</a>`
        ]}
      </p>
    `
  }
}
