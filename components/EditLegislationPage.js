const Component = require('./Component')
const EditLegislationForm = require('./EditLegislationForm')
const LoadingIndicator = require('./LoadingIndicator')

module.exports = class EditLegislationPage extends Component {
  oninit() {
    if (!this.state.user) return this.location.redirect('/sign_in')

    this.setState({ editing_bill: {}, loading: 'populating' })

    return this.fetchLegislatures().then(() => this.fetchLegislation()).then(() => this.setState({ loading: false }))
  }
  onpagechange(oldProps) {
    if (this.props.url !== oldProps.url) return this.oninit()
  }
  fetchLegislation() {
    const { editing_bill, user } = this.state
    const { params } = this.props
    return this.api(`/legislation_detail?author_id=eq.${user.id}&${editing_bill.id ? `id=eq.${editing_bill.id}` : `short_id=eq.${params.short_id}`}`)
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
  render() {
    return this.html`
      <section class="section">
        <div class="container">
          <h2 class="title is-5">Edit Draft Legislation</h2>
          ${this.state.loading === 'populating' ? LoadingIndicator.for(this) : EditLegislationForm.for(this)}
        </div>
      </section>
    `
  }
}
