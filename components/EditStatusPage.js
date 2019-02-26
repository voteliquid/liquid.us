const { ASSETS_URL } = process.env
const Component = require('./Component')
const LoadingIndicator = require('./LoadingIndicator')
const MeasureDetailsStatusUpdate = require('./MeasureDetailsStatusUpdate')
const NotFound = require('./NotFound')


module.exports = class EditStatusPage extends Component {

  oninit() {
    const { user, config, measures = {} } = this.state
    const { params } = this.props
    const measure = measures[params.short_id]

    this.setState({
      showMeasureVoteForm: false,
    })
    if (!this.state.user) return this.location.redirect('/sign_in')
    if ((measure && user && user.id !== measure.author_id) && (measure && measure.proposed === false)) return this.location.redirect(302, `/legislation/${measure.short_id}`)

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
        page_description: `Vote directly on federal, state, and local bills and nominations. We'll notify your representatives and grade them for how well they listen to their constituents.`,
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

    })
    .catch((error) => {
      console.log(error)
      this.location.setStatus(404)
      return { error, loading_measure: false }
    })
  }

  fetchConstituentVotes(measure, office_id) {
    const { id, short_id } = measure
    const officeParam = office_id && measure.legislature_name === 'U.S. Congress' ? `&office_id=eq.${office_id}` : '&limit=1'
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
          ? MeasureDetailsStatusUpdate.for(this, { measure })
          : NotFound.for(this)
    }</div>`
  }
}
