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
    return new Promise((resolve) => {
      const proposedLegislation = {
        id: 'testid',
        title: 'The Liquid Democracy Act of 2018',
        description: 'Liquid Democracy is the law!',
        public: false,
        created_at: '2018-04-01T10:33:03Z',
      }
      setTimeout(() => resolve({ proposedLegislation }), 1000)
    })
  }

  render() {
    const { proposedLegislation = {}, user } = this.state
    const s = proposedLegislation
    const author_fullname = user.last_name ? `${user.first_name} ${user.last_name}` : 'Anonymous'
    const created_at = new Date(s.created_at).toLocaleDateString()

    return this.html`
      <section class="section">
        <div class="container">
          <div class="content">
            <h2 class="title is-5">${s.title}</h2>
            <div class="is-size-7 has-text-grey">
              ${[user.username
                ? `Created by <a href=${`/${user.username}`}>${author_fullname}</a> on ${created_at}`
                : `Created by Anonymous on ${created_at}`]}
            </div>
            <p>${s.description}</p>
          </div>
        </div>
      </section>
    `
  }
}
