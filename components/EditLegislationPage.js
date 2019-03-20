const Component = require('./Component')
const EditLegislationForm = require('./EditLegislationForm')
const LoadingIndicator = require('./LoadingIndicator')

module.exports = class EditLegislationPage extends Component {
  oninit() {
    if (!this.state.user) return this.location.redirect('/sign_in')

    this.setState({ editing_bill: {}, loading: 'populating' }).setProps({})

    return this.fetchLegislation().then(() => this.setState({ loading: false }))
  }
  onpagechange(oldProps) {
    if (this.props.url !== oldProps.url) return this.oninit()
  }
  fetchLegislation() {
    const { editing_bill, user } = this.state
    const { params } = this.props
    return this.api(`/measures_detailed?author_id=eq.${user.id}&${editing_bill.id ? `id=eq.${editing_bill.id}` : `short_id=eq.${params.short_id}`}`)
      .then((legislation) => {
        if (legislation[0] && legislation[0].published) {
          return this.location.redirect(302, `/legislation/${legislation[0].short_id}`)
        }
        return this.setState({ editing_bill: legislation[0] })
      })
  }
  render() {
    return this.html`
      <section class="section">
        <div class="container is-widescreen">
          <h2 class="title is-5">Edit Draft Legislation</h2>
          ${this.state.loading === 'populating' ? LoadingIndicator.for(this) : EditLegislationForm.for(this)}
        </div>
      </section>
    `
  }
}
