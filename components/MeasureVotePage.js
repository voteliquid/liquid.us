const Component = require('./Component')
const LoadingIndicator = require('./LoadingIndicator')
const MeasureVoteForm = require('./MeasureVoteForm')
const Sidebar = require('./MeasureDetailsSidebar')
const fetchMeasure = require('./MeasureDetailsPage').prototype.fetchMeasure

module.exports = class MeasureVotePage extends Component {
  oninit() {
    const { measures = {} } = this.state
    const { params } = this.props
    const measure = measures[params.short_id]

    if (measure) {
      if (!measure.my_vote) {
        return this.fetchVote(measure)
      }
    } else {
      this.setState({ loading_measure: true })
      return fetchMeasure.call(this, params.short_id).then((measure) => {
        this.setState({
          loading_measure: false,
          measures: {
            ...measures,
            [measure.short_id]: measure,
          },
        })
        return this.fetchVote(measure)
      })
    }
  }
  onpagechange(oldProps) {
    if (oldProps.url !== this.props.url) {
      this.oninit()
    }
  }
  fetchVote(measure) {
    const { config, measures, user } = this.state
    const page_title = `Vote on ${measure.title}`
    if (user) {
      return this.api(`/votes?user_id=eq.${user.id}&delegate_rank=eq.-1&order=updated_at.desc`).then(votes => {
        const last_vote_public = votes[0] && votes[0].public
        return this.api(`/votes?measure_id=eq.${measure.id}&user_id=eq.${user.id}&delegate_rank=eq.-1`).then(votes => {
          measure.my_vote = votes[0]
          return this.api(`/rpc/vote_power_for_measure`, {
            method: 'POST',
            body: JSON.stringify({ user_id: user.id, measure_id: measure.id })
          }).then((measure_vote_power) => {
            measure.vote_power = measure_vote_power
            if (this.isBrowser) {
              const page_title = `Vote on ${measure.title} ★ ${config.APP_NAME}`
              window.document.title = page_title
              window.history.replaceState(window.history.state, page_title, document.location)
            }
            return this.setState({
              page_title,
              measures: {
                ...measures,
                [measure.short_id]: {
                  ...measures[measure.short_id],
                  ...measure,
                },
              },
              last_vote_public,
            })
          })
        })
      })
    }
  }
  render() {
    const { loading_measure, measures = {} } = this.state
    const { params } = this.props
    const measure = measures[params.short_id]
    return this.html`<div>
      ${measure && !loading_measure ? MeasureVotePageLoaded.for(this, { measure }) : LoadingIndicator.for(this)}
    </div>`
  }
}

class MeasureVotePageLoaded extends Component {
  render() {
    const { user } = this.state
    const { measure: l } = this.props
    const { my_vote: v = {} } = l
    return this.html`
      <section class="section">
        <div class="container is-widescreen">
          <div class="columns">
            <div class="column is-three-quarters">
              <h2 class="title is-4 has-text-weight-normal">${l.vote_position ? 'Edit your vote' : 'Vote'} on ${[l.introduced_at ? `${l.type} ${l.number} &mdash; ${l.title}` : l.title]}</h2>
            ${(v.id && !user.verified) ? [`
              <div class="notification is-info">
                <span class="icon"><i class="fa fa-exclamation-triangle"></i></span>
                <strong>Help hold your reps accountable!</strong><br />
                Your vote has been recorded, and we'll send it to your elected reps, but it won't be included in their Representation Grade until you <a href="/get_started">verify your identity</a>.
              </div>
            `] : ''}
              ${MeasureVoteForm.for(this, { measure: l })}
            </div>
            <div class="column is-one-quarter">
              ${Sidebar.for(this, { ...l, user }, `vote-measure-sidebar-${l.id}`)}
            </div>
          </div>
        </div>
      </section>
    `
  }
}
