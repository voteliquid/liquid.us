const Component = require('./Component')
const LoadingIndicator = require('./LoadingIndicator')
const EditButtons = require('./EditMeasureButtons')
const PublicProfileRequiredMsg = require('./PublicProfileRequiredMsg')

module.exports = class YourProposedLegislationPage extends Component {
  oninit() {
    if (!this.state.user) return this.location.redirect('/sign_in')
    return this.fetchYourProposedLegislation()
  }
  onpagechange(oldProps) {
    if (this.props.url !== oldProps.url) this.oninit()
  }
  fetchYourProposedLegislation() {
    this.setState({ loading: true })
    return this.api(`/measures_detailed?author_id=eq.${this.state.user.id}&order=created_at.desc`)
      .then(yourLegislation => this.setState({ loading: false, yourLegislation }))
  }
  render() {
    return this.html`
      <section class="section">
        <div class="container">
          ${this.state.user.username ? YourProposedLegislationList.for(this) : PublicProfileRequiredMsg.for(this)}
        </div>
      </section>
    `
  }
}

class YourProposedLegislationList extends Component {
  render() {
    const { config, loading, yourLegislation = [], user } = this.state
    return this.html`
      <nav class="breadcrumb has-succeeds-separator is-left is-small" aria-label="breadcrumbs">
        <ul>
          <li><a class="has-text-grey" href="/">${config.APP_NAME}</a></li>
          <li><a class="has-text-grey" href="${`/${user.username}`}">${user.first_name} ${user.last_name}</a></li>
          <li class="is-active"><a class="has-text-grey" href="#" aria-current="page">Proposed Legislation</a></li>
        </ul>
      </nav>
      ${ProposeButton.for(this)}
      <h2 class="title is-5">Your Proposed Legislation</h2>
      ${loading
        ? LoadingIndicator.for(this)
        : yourLegislation.length
          ? yourLegislation.map((p, idx) => ProposedLegislationItem.for(this, p, `proposed-${idx}`))
          : ['<p>You have not proposed any legislation yet.</p>']}
    <style>
      .highlight-hover:hover {
        background: #f6f8fa;
      }
    </style>
    `
  }
}

class ProposedLegislationItem extends Component {
  render() {
    const { user } = this.state
    const l = this.props
    return this.html`
      <div class="card highlight-hover">
        <div class="card-content">
          <div class="columns">
            <div class="column">
              <h3>${l.published ? '' : ['<span class="tag is-warning">Draft</span>&nbsp;']}<a href="${`/${user.username}/legislation/${l.short_id}`}">${l.title}</a></h3>
              <p class="is-size-7 has-text-grey">
                Proposed for ${l.legislature_name} &bullet; ${l.author_username
              ? [`Authored by <a href="/${l.author_username}">${l.author_first_name} ${l.author_last_name}</a> on ${(new Date(l.created_at)).toLocaleDateString()}`]
              : `Authored anonymously on ${(new Date(l.created_at)).toLocaleDateString()}`}
              </p>
            </div>
            <div class="column has-text-right has-text-left-mobile">
              ${!l.published ? EditButtons.for(this, l) : ''}
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
