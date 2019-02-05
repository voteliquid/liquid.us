const { ASSETS_URL } = process.env
const Component = require('./Component')
const Comment = require('./Comment')
const LoadingIndicator = require('./LoadingIndicator')
const Sidebar = require('./EndorsementPageSidebar')
const Endorse = require('./Endorse')
const { fetchConstituentVotes } = require('./MeasureDetailsPage').prototype
const stateNames = require('datasets-us-states-abbr-names')

module.exports = class CommentPage extends Component {
  oninit() {
    const { config, measures = {}, offices = [] } = this.state
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

      const voteUrl = `/${measure.type === 'nomination' ? 'nominations' : 'legislation'}/${measure.short_id}/votes/${params.comment_id}`

      if (measure.author_id && !params.username) {
        return this.location.redirect(301, `/${measure.author_username}${voteUrl}`)
      }

      if (!measure.author_id && params.username) {
        this.location.setStatus(404)
        return this.setState({ loading_measure: false })
      }

      const officesInChamber = offices.filter(({ chamber }) => chamber === measure.chamber)
      const officeId = officesInChamber[0] && officesInChamber[0].id
      return fetchConstituentVotes.call(this, measure, officeId).then(() => {
        return this.fetchComment(params.comment_id, measure).then(comment => {
          if (!comment) {
            this.location.setStatus(404)
            return this.setState({ loading_measure: false })
          }

          measure.comment = comment

          const anonymousName = `${measure.legislature_name === 'U.S. Congress' ? 'American' : (stateNames[measure.legislature_name] || measure.legislature_name)} Resident`

          const page_title = `${comment.fullname || anonymousName} voted ${comment.position} on ${measure.legislature_name}: ${measure.title}`
          if (this.isBrowser) {
            const page_title_with_appname = `${page_title} | ${config.APP_NAME}`
            window.document.title = page_title_with_appname
            window.history.replaceState(window.history.state, page_title_with_appname, document.location)
          }
          const isCity = ~measure.legislature_name.indexOf(',')
          const measureImage = (!isCity) ? `${ASSETS_URL}/legislature-images/${measure.legislature_name}.png` : ''
          const authorImage = comment.username || comment.twitter_username ? this.avatarURL(comment) : null
          const ogImage = authorImage || measureImage

          this.setState({
            loading_measure: false,
            page_title,
            page_description: this.escapeHtml(comment.comment, { replaceAmp: true }),
            og_image_url: ogImage,
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
    return this.api(`/votes_detailed?measure_id=eq.${measure.id}&id=eq.${id}`).then(([comment]) => (comment))
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
    const { legislatures = [], user, reps } = this.state
    const { measure: l } = this.props
    const city = `${user.address.city}, ${user.address.state}`
    const myReps = l.legislature_name === 'U.S. Congress' ? `To Representative ${reps[0].office_holder.first_name} ${reps[0].office_holder.last_name}, Senator ${reps[1].office_holder.first_name} ${reps[1].office_holder.last_name}, Senator ${reps[2].office_holder.first_name} ${reps[2].office_holder.last_name}, and the U.S. Congress:` : l.legislature_name === city ? `To the City of ${l.legislature_name}'s elected leaders:` : l.legislature_name === user.address.state && reps[3] ? `To Representative ${reps[3].office_holder.first_name} ${reps[3].office_holder.last_name}, Senator ${reps[4].office_holder.first_name} ${reps[4].office_holder.last_name}, and the ${l.legislature_name} Legislature:` : l.legislature_name === user.address.state ? `To the ${l.legislature_name} Legislature:` : `You do not live in ${l.legislature_name}, so you cannot endorse this position.`
    const message = `We, the undersigned, ${l.vote_position === 'yea' ? 'support' : 'oppose'} the proposal below and ask that you consider our argument and comments.`
    const title = l.type === 'nomination' ? `Do you support ${l.title.replace(/\.$/, '')}?` : l.title
    const url = `${l.author_username ? `/${l.author_username}/` : '/'}${l.type === 'nomination' ? 'nominations' : 'legislation'}/${l.short_id}`
    const userInJurisdiction = user && legislatures && legislatures.some(({ name }) => name === l.legislature_name)

    return this.html`
      <section class="section">
        <div class="container is-widescreen">
          <div class="columns">
            <div class="column">
             <h2 class="title has-text-weight-normal is-5"><a class="has-text-dark"> ${myReps}</a></h2>
             <div class="subtitle is-size-6"><a class="has-text-dark">
             <br>${message}<br><br>
            </a></div>
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
              ${Comment.for(this, { ...l.comment, shouldTruncate: false })}
              ${l.comment && (!user || userInJurisdiction) ? Endorse.for(this, { vote: l.comment, vote_position: l.vote_position, user }) : ''}
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
