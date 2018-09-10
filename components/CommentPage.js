const Component = require('./Component')
const Comment = require('./Comment')
const LoadingIndicator = require('./LoadingIndicator')
const Sidebar = require('./MeasureDetailsSidebar')

module.exports = class CommentPage extends Component {
  oninit() {
    const { config, measures = {} } = this.state
    const { params } = this.props

    const url = `/measures_detailed?short_id=eq.${params.short_id}`

    this.setState({ loading_measure: true })

    return this.api(url).then((results) => {
      const measure = results[0]

      if (measure) {
        return this.fetchComment(params.comment_id, measure).then(comment => {
          measure.comment = comment

          const page_title = `${this.possessive(comment.fullname || 'Anonymous')} vote on ${measure.title}`
          if (this.isBrowser) {
            const page_title_with_appname = `${page_title} ★ ${config.APP_NAME}`
            window.document.title = page_title_with_appname
            window.history.replaceState(window.history.state, page_title_with_appname, document.location)
          }

          return this.setState({
            loading_measure: false,
            page_title,
            page_description: this.escapeHtml(comment.comment, { replaceAmp: true }),
            measures: {
              ...measures,
              [measure.short_id]: {
                ...measures[measure.short_id],
                ...measure
              },
            },
          })
        })
      }

      this.location.setStatus(404)
      return this.setState({ loading_measure: false })
    })
    .catch((error) => {
      this.location.setStatus(404)
      return this.setState({ error, loading_measure: false })
    })
  }
  fetchComment(id, measure) {
    return this.api(`/public_votes?measure_id=eq.${measure.id}&id=eq.${id}`)
    .then(([comment]) => (comment))
  }
  onpagechange(oldProps) {
    if (this.props.url !== oldProps.url) {
      this.oninit().then((newState) => this.setState(newState))
    }
  }
  render() {
    const { loading_measure, measures = {} } = this.state
    const { params } = this.props
    const measure = measures[params.short_id]

    return this.html`<div>${
      loading_measure
        ? LoadingIndicator.for(this)
        : measure && measure.comment
          ? CommentDetailPage.for(this, { measure })
          : CommentNotFoundPage.for(this)
    }</div>`
  }
}

class CommentNotFoundPage extends Component {
  render() {
    return this.html`
      <section class="hero is-fullheight is-dark">
        <div class="hero-body">
          <div class="container has-text-centered">
            <h1 class="title">Can't find comment ${[this.location.path]}</h1>
            <h2 class="subtitle">Maybe the URL is mistyped?</h2>
          </div>
        </div>
      </section>
    `
  }
}

class CommentDetailPage extends Component {
  render() {
    const { config, user } = this.state
    const { measure: l } = this.props
    const bill_id = l.introduced_at ? `${l.type} ${l.number}` : l.title
    const title = l.type === 'PN' ? `Do you support ${l.title.replace(/\.$/, '')}?` : l.title

    return this.html`
      <section class="section">
        <div class="container is-widescreen">
          <nav class="breadcrumb has-succeeds-operator is-left is-small" aria-label="breadcrumbs">
            <ul>
              <li><a class="has-text-grey" href="/">${config.APP_NAME}</a></li>
              ${l.type !== 'PN' ? [`<li><a class="has-text-grey" href="/legislation">Legislation</a></li>`] : ''}
              <li><a class="has-text-grey" href="${`/${l.type === 'PN' ? 'nominations' : 'legislation'}/${l.short_id}`}">${l.introduced_at ? bill_id : 'Measure Details'}</a></li>
              <li class="is-active"><a class="has-text-grey" href="#" aria-current="page">${this.possessive(l.comment.fullname || 'Anonymous')} vote</a></li>
            </ul>
          </nav>
          <div class="columns">
            <div class="column">
              <h2 class="title has-text-weight-normal is-4">${title}</h2>
              ${Comment.for(this, l.comment)}
              <div><a href="${`/${l.type === 'PN' ? 'nominations' : 'legislation'}/${l.short_id}`}">See all comments <span class="icon"><i class="fa fa-long-arrow-right"></i></span></a></a></div>
            </div>
            <div class="column is-one-quarter">
              ${Sidebar.for(this, { ...l, user }, `measure-sidebar-${l.id}`)}
            </div>
          </div>
        </div>
      </section>
    `
  }
}
