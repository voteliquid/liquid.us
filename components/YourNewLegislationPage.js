const Component = require('./Component')

module.exports = class YourNewLegislationPage extends Component {
  oninit() {
    if (!this.state.user) {
      this.location.redirect('/sign_in')
    }

    if (!this.state.yourLegislation) {
      return this.fetchYourProposedLegislation()
    }
  }

  fetchYourProposedLegislation() {
    return this.api(`/new_legislation?author_id=eq.${this.state.user.id}`)
    .then(yourLegislation => ({ yourLegislation }))
  }

  render() {
    const { yourLegislation = [] } = this.state

    return this.html`
      <section class="section">
        <div class="container">
          ${NewButton.for(this)}
          <h2 class="title is-5">Your Proposed Legislation</h2>
          ${yourLegislation.map((p, idx) => ProposedLegislationItem.for(this, p, `proposed-${idx}`))}
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

class ProposedLegislationItem extends Component {
  render() {
    const s = this.props
    const { user } = this.state
    return this.html`
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
    `
  }
}

class NewButton extends Component {
  render() {
    return this.html`
      <a style="white-space: inherit; height: auto;" class='button is-primary is-pulled-right is-small is-outlined' href="/legislation/new">
        <span class="icon" style="align-self: flex-start;"><i class='fa fa-file-o'></i></span>
        <span class="has-text-weight-semibold">New</span>
      </a>
    `
  }
}
