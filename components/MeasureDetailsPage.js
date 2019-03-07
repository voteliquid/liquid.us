const { ASSETS_URL } = process.env
const Component = require('./Component')
const LoadingIndicator = require('./LoadingIndicator')
const MeasureDetails = require('./MeasureDetails')
const NotFound = require('./NotFound')

module.exports = class MeasureDetailsPage extends Component {
  oninit() {
    const { config, measures = {}, offices = [] } = this.state
    const { params } = this.props
    const measure = measures[params.short_id]

    this.setState({
      showMeasureVoteForm: false,
    })

    if (measure) {
      const title = `${measure.legislature_name}: ${measure.title}`
      if (this.isBrowser) {
        const page_title = `${title} | ${config.APP_NAME}`
        window.document.title = page_title
        window.history.replaceState(window.history.state, page_title, document.location)
      }
    } else {
      this.setState({ loading_measure: true })
    }
    return this.fetchMeasure(params.short_id).then((measure) => {
      if (!measure) {
        this.location.setStatus(404)
        return this.setState({ loading_measure: false })
      }

      const title = `${measure.legislature_name}: ${measure.title}`
      if (this.isBrowser) {
        const page_title = `${title} | ${config.APP_NAME}`
        window.document.title = page_title
        window.history.replaceState(window.history.state, page_title, document.location)
      }
      const isCity = ~measure.legislature_name.indexOf(',')
      const measureImage = (!isCity) ? `${ASSETS_URL}/legislature-images/${measure.legislature_name}.png` : ''
      this.setState({
        loading_measure: false,
        showMeasureVoteForm: this.location.query.action === 'add-argument',
        page_title: title,
        page_description: `Discuss with your fellow voters & be heard by your elected officials.`,
        selected_bill: measure,
        og_image_url: measureImage,
        measures: {
          ...this.state.measures,
          [measure.short_id]: {
            ...(this.state.measures || {})[measure.short_id],
            ...measure,
          }
        },
      })

      const officesInChamber = offices.filter(({ chamber }) => chamber === measure.chamber)
      const officeIds = officesInChamber.map((office) => office.id)

      return this.fetchComments(measure.id, measure.short_id)
        .then(() => this.fetchTopComments(measure.id, measure.short_id))
        // .then(() => this.fetchConstituentVotes(measure, officeIds)) // TODO disabled too slow
        // .then(() => this.fetchProxyVotes(measure.id, measure.short_id)) // TODO broken
    })
    .catch((error) => {
      console.log(error)
      this.location.setStatus(404)
      return { error, loading_measure: false }
    })
  }
  fetchConstituentVotes(measure, office_ids) {
    const { id, short_id } = measure
    if (!Array.isArray(office_ids)) office_ids = [office_ids]
    const officeParam = office_ids && measure.legislature_name === 'U.S. Congress' ? `&office_id=in.(${office_ids.join(',')})` : '&limit=1'
    return this.api(`/measure_votes?measure_id=eq.${id}${officeParam}`).then((results) => {
      const votes = results[0] || {}
      const measures = this.state.measures || {}
      this.setState({
        measures: {
          ...measures,
          [short_id]: {
            ...measures[short_id],
            ...votes
          },
        },
      })
    })
  }
  fetchTopComments(id, short_id) {
    const order = `order=proxy_vote_count.desc.nullslast,created_at.desc`
    return this.api(`/votes_detailed?measure_id=eq.${id}&comment=not.is.null&comment=not.eq.&position=eq.yea&${order}`).then((comments) => {
      const yea = comments[0]

      return this.api(`/votes_detailed?measure_id=eq.${id}&comment=not.is.null&comment=not.eq.&position=eq.nay&${order}`).then((comments) => {
        const nay = comments[0]
        this.setState({
          measures: {
            ...this.state.measures,
            [short_id]: {
              ...this.state.measures[short_id],
              top_yea: yea,
              top_nay: nay,
            },
          },
        })
      })
    })
  }
  fetchMeasure(short_id) {
    const measureUrl = `/${~short_id.indexOf('-pn') ? 'nominations' : 'legislation'}/${short_id}`
    const url = `/measures_detailed?short_id=eq.${short_id}`

    return this.api(url).then((results) => {
      const measure = results[0]
      if (measure && measure.author_id && !this.props.params.username) {
        if (new Date(measure.created_at) > new Date('2018-10-16')) return null
        return this.location.redirect(301, `/${measure.author_username}${measureUrl}`)
      }
      if (!measure || (!measure.author_id && this.props.params.username)) return null
      return measure
    })
  }
  fetchProxyVotes(measure_id, short_id) {
    if (this.state.user) {
      return this.api(`/inherited_votes_detailed?measure_id=eq.${measure_id}`).then((inheritedVotes) => {
        return this.api(`/proxy_votes_detailed?measure_id=eq.${measure_id}&order=proxy_vote_count.desc,created_at.desc`).then((proxyVotes) => {
          this.setState({
            measures: {
              ...this.state.measures,
              [short_id]: {
                ...this.state.measures[short_id],
                proxyVotes: (inheritedVotes.map((vote) => {
                  return {
                    ...vote,
                    ...vote.proxy,
                    fullname: vote.proxy && `${vote.proxy.first_name} ${vote.proxy.last_name}`,
                    endorsed_vote: vote.root_vote,
                  }
                }).concat(proxyVotes)).filter(item => !item.endorsed_vote),
              },
            },
          })
        })
      })
    }
    return Promise.resolve()
  }
  fetchComments(measure_id, short_id) {
    const { query } = this.location
    const order = query.order || 'most_recent'
    const position = query.position || 'all'
    const orders = {
      most_recent: 'created_at.desc',
      vote_power: 'proxy_vote_count.desc.nullslast,created_at.desc',
    }
    const positions = {
      all: '',
      yea: '&position=eq.yea',
      nay: '&position=eq.nay',
    }
    return this.api(`/votes_detailed?measure_id=eq.${measure_id}&comment=not.is.null&comment=not.eq.&order=${orders[order]}${positions[position]}`).then((comments) => {
      this.setState({
        measures: {
          ...this.state.measures,
          [short_id]: {
            ...this.state.measures[short_id],
            comments: comments.filter((item) => !item.endorsed_vote),
            cur_endorsement: comments.filter(c => c.endorsed)[0]
          },
        },
      })
    })
  }
  onpagechange(oldProps) {
    if (this.props.url !== oldProps.url && this.state.measures) {
      this.oninit()
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
          ? MeasureDetails.for(this, { measure })
          : NotFound.for(this)
    }</div>`
  }
}
