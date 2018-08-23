const Component = require('./Component')
const LoadingIndicator = require('./LoadingIndicator')
const MeasureDetails = require('./MeasureDetails')
const NotFound = require('./NotFound')

module.exports = class MeasureDetailsPage extends Component {
  oninit() {
    const { config, measures = {}, user } = this.state
    const { params } = this.props
    const measure = measures[params.short_id]

    if (measure) {
      if (!measure.yea_comments) {
        return this.setMeasureState(this.fetchComments(measure))
          .then(() => this.setMeasureState(this.fetchProxyVotes(measure, user)))
      }
      if (!measure.proxyVotes) return this.setMeasureState(this.fetchProxyVotes(measure, user))
      return Promise.resolve()
    }

    this.setState({ loading_measure: true })
    return this.fetchMeasure(params.short_id)
      .then((measure) => {
        if (!measure) {
          this.location.setStatus(404)
          return this.setState({ loading_measure: false })
        }

        const title = measure.introduced_at ? `${measure.type} ${measure.number} – ${measure.title}` : measure.title
        if (this.isBrowser) {
          const page_title = `${title} ★ ${config.APP_NAME}`
          window.document.title = page_title
          window.history.replaceState(window.history.state, page_title, document.location)
        }
        this.setState({
          loading_measure: false,
          page_title: title,
          page_description: `Vote directly on federal bills and nominations. We'll notify your representatives and grade them for how well they listen to their constituents.`,
          measures: {
            ...measures,
            [measure.short_id]: measure,
          },
        })

        return this.setMeasureState(this.fetchComments(measure))
          .then(() => this.setMeasureState(this.fetchProxyVotes(measure, user)))
      })
      .catch((error) => {
        this.location.setStatus(404)
        return { error, loading_measure: false }
      })
  }
  setMeasureState(promise) {
    const measures = this.state
    return promise.then((measure) => this.setState({
      ...measures,
      [measure.short_id]: {
        ...this.state.measures[measure.short_id],
        ...measure,
      },
    }))
  }
  fetchMeasure(short_id) {
    const type = ~short_id.indexOf('-pn') ? '&type=eq.PN' : '&or=(type.eq.HR,type.eq.S)'
    const url = `/measures_detailed?short_id=eq.${short_id}${type}`

    return this.api(url).then((results) => results[0])
  }
  fetchProxyVotes(measure, user) {
    if (user) {
      return this.api(`/delegations_detailed?from_id=eq.${user.id}&order=delegate_rank.asc`)
        .then((proxies) => {
          const measure_id = measure.id
          const proxyIds = proxies.map(({ to_id }) => to_id)
          return this.api(`/public_votes?measure_id=eq.${measure_id}&user_id=in.(${proxyIds.join(',')})&order=proxy_vote_count.desc,created_at.desc`)
        })
        .then((proxyVotes) => {
          measure.proxyVotes = proxyVotes
          return measure
        })
    }
    return Promise.resolve(measure)
  }
  fetchComments(measure) {
    return this.api(`/public_votes?measure_id=eq.${measure.id}&order=proxy_vote_count.desc.nullslast,created_at.desc`)
    .then(comments => {
      measure.yea_comments = comments.filter(({ position }) => position === 'yea')
      measure.nay_comments = comments.filter(({ position }) => position === 'nay')
      return measure
    })
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

    return this.html`${
      loading_measure
        ? LoadingIndicator.for(this)
        : measure
          ? MeasureDetails.for(this, { measure })
          : NotFound.for(this)
    }`
  }
}
