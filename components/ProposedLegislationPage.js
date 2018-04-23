const Component = require('./Component')

module.exports = class ProposedLegislationPage extends Component {
  oninit() {
    if (!this.state.user) {
      this.location.redirect('/sign_in')
    }

    if (!this.state.proposedLegislation) {
      return this.fetchLegislation()
    }
  }

  fetchLegislation() {
    const { params } = this.props

    return this.api(`/new_legislation?id=eq.${params.proposalId}`)
    .then(([proposedLegislation]) => ({ proposedLegislation }))
  }

  render() {
    const { proposedLegislation = {}, user } = this.state

    const s = proposedLegislation

    return this.html`
      <section class="section">
        <div class="container">
          <h2 class="title is-5">Your Proposed Legislation</h2>
          <div class="card highlight-hover">
            <div class="card-content">
              <div class="columns">
                <div class="column">
                  ${!s.public ?
                    [`<a href="${`/${user.username}/${s.id}`}" class="button is-small is-danger is-outlined is-pulled-right">Unpublished</a>`]
                  : []}
                  <h3><a href="${`/${user.username}/${s.id}`}">${s.title}</a></h3>
                  <div class="is-size-7 has-text-grey">
                    Created by <a href=${`/${user.username}`}>${user.first_name} ${user.last_name}</a> on ${(new Date(s.created_at)).toLocaleDateString()}
                  </div>
                  <br />
                  <div>${s.description}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <style>
          .highlight-hover:hover {
            background: #f6f8fa;
          }
        </style>
      </section>
    `
  }
}
