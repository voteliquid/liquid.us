const Component = require('./Component')
const LoadingIndicator = require('./LoadingIndicator')

module.exports = class YourProposedLegislationPage extends Component {
  oninit() {
    if (!this.state.user) {
      this.location.redirect('/sign_in')
    }

    if (!this.state.yourLegislation) {
      return this.fetchYourProposedLegislation()
    }
  }

  onpagechange(oldProps) {
    if (this.props.url !== oldProps.url) {
      return this.fetchYourProposedLegislation()
    }
  }

  fetchYourProposedLegislation() {
    this.setState({ loading: true })
    return this.api(`/legislation_detail?author_id=eq.${this.state.user.id}`)
      .then(yourLegislation => this.setState({ loading: false, yourLegislation }))
  }

  render() {
    const { config, loading, yourLegislation = [] } = this.state

    return this.html`
      <section class="section">
        <div class="container">
          <nav class="breadcrumb has-succeeds-separator is-left is-small" aria-label="breadcrumbs">
            <ul>
              <li><a class="has-text-grey" href="/">${config.APP_NAME}</a></li>
              <li><a class="has-text-grey" href="/legislation">Legislation</a></li>
              <li class="is-active"><a class="has-text-grey" href="#" aria-current="page">Yours</a></li>
            </ul>
          </nav>
          ${ProposeButton.for(this)}
          <h2 class="title is-5">Your Proposed Legislation</h2>
          ${loading
            ? LoadingIndicator.for(this)
            : yourLegislation.length
              ? yourLegislation.map((p, idx) => ProposedLegislationItem.for(this, p, `proposed-${idx}`))
              : ['<p>You have not proposed any legislation yet.</p>']}
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
    return this.html`
      <div class="card highlight-hover">
        <div class="card-content">
          <div class="columns">
            <div class="column">
              <h3><a href="${`/legislation/${s.short_id}`}">${s.title}</a></h3>
              <p class="is-size-7 has-text-grey">
                Proposed for ${s.legislature_name} &bullet; ${s.author_username
              ? [`Authored by <a href="/${s.author_username}">${s.author_first_name} ${s.author_last_name}</a> on ${(new Date(s.created_at)).toLocaleDateString()}`]
              : `Authored anonymously on ${(new Date(s.created_at)).toLocaleDateString()}`}
              </p>
            </div>
            <div class="column has-text-right has-text-left-mobile">
              ${[!s.published
                ? `
                  <a href="${`/legislation/${s.short_id}/edit`}" class="button is-small">
                    <span class="icon is-small"><i class="fa fa-pencil"></i></span><span>Edit</span>
                  </a>
                  <a href="${`/legislation/${s.short_id}/edit`}" class="button is-small is-danger is-outlined">Unpublished</a>
                `
                : `<a href="${`/legislation/${s.short_id}`}" class="button is-small is-success is-outlined">Published</a>`
              ]}
            </div>
          </div>
        </div>
      </div>
    `
  }
}

class ProposeButton extends Component {
  render() {
    return this.html`
      <a class="button is-pulled-right is-small" href="/legislation/propose">
        <span class="icon"><i class='fa fa-file'></i></span>
        <span class="has-text-weight-semibold">Propose a Bill</span>
      </a>
    `
  }
}
