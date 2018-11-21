const Component = require('./Component')
const Comment = require('./Comment')
const LoadingIndicator = require('./LoadingIndicator')
const Sidebar = require('./MeasureDetailsSidebar')
const Endorse = require('./Endorse')
const { fetchConstituentVotes } = require('./MeasureDetailsPage').prototype

module.exports = class CommentPage extends Component {
  oninit() {
    const { config, measures = {}, reps = [] } = this.state
    const { params } = this.props

    const url = `/measures_detailed?short_id=eq.${params.short_id}`

    if (!measures[params.short_id] || !measures[params.short_id].comment) {
      this.setState({ loading_measure: true })
    }

    return this.api(url).then((results) => {
      const measure = results[0]

      if (!measure) {
        this.location.setStatus(404)
        return this.setState({ loading_measure: false })
      }

      const voteUrl = `/${measure.type === 'PN' ? 'nominations' : 'legislation'}/${measure.short_id}/votes/${params.comment_id}`

      if (measure.author_id && !params.username) {
        return this.location.redirect(301, `/${measure.author_username}${voteUrl}`)
      }

      if (!measure.author_id && params.username) {
        this.location.setStatus(404)
        return this.setState({ loading_measure: false })
      }

      const repsInChamber = reps.filter(({ office_chamber }) => office_chamber === measure.chamber)
      const officeId = repsInChamber[0] && repsInChamber[0].office_id
      return fetchConstituentVotes.call(this, measure, officeId).then(() => {
        return this.fetchComment(params.comment_id, measure).then(comment => {
          if (!comment) {
            this.location.setStatus(404)
            return this.setState({ loading_measure: false })
          }

          measure.comment = comment

          const page_title = `${this.possessive(comment.fullname || 'Anonymous')} vote on ${measure.title}`
          if (this.isBrowser) {
            const page_title_with_appname = `${page_title} | ${config.APP_NAME}`
            window.document.title = page_title_with_appname
            window.history.replaceState(window.history.state, page_title_with_appname, document.location)
          }

          return this.setState({
            loading_measure: false,
            page_title,
            page_description: this.escapeHtml(comment.comment, { replaceAmp: true }),
            measures: {
              ...this.state.measures,
              [measure.short_id]: {
                ...this.state.measures[measure.short_id],
                ...measure
              },
            },
          })
        })
      })
    })
    .catch((error) => {
      console.log(error)
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
        : measure
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
    const { user } = this.state
    const { measure: l } = this.props
    const title = l.type === 'PN' ? `Do you support ${l.title.replace(/\.$/, '')}?` : l.title
    const url = `${l.author_username ? `/${l.author_username}/` : '/'}${l.type === 'PN' ? 'nominations' : 'legislation'}/${l.short_id}`

    return this.html`
      <section class="section">
        <div class="container is-widescreen">
          <div class="columns">
            <div class="column">
              <h2 class="title has-text-weight-normal is-4"><a class="has-text-dark" href="${url}">${title}</a></h2>
              <div class="subtitle is-size-7">
                <a class="is-size-7 has-text-grey button is-text" href="${url}">
                  <span>More details</span>
                </a>
              </div>
              <style>
                .endorse {
                  position: fixed;
                  bottom: 0;
                  left: 0;
                  right: 0;
                  z-index: 9999;
                }
              </style>
              ${Comment.for(this, l.comment)}
              ${Endorse.for(this, { vote: l.comment, vote_position: l.vote_position, user })}
              <br />
              <div>
                <a class="is-size-7 has-text-grey button is-text" href="${url}">
                  <span>See all arguments for this ${l.type === 'PN' ? 'nomination' : 'bill'}</span>
                </a>
              </div>
            </div>
            <div class="column is-one-quarter">
              ${Sidebar.for(this, { ...l, user }, `commentpage-sidebar-${l.id}`)}
            </div>
          </div>
        </div>
      </section>
    `
  }
}
