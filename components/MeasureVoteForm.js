const Component = require('./Component')
const LoadingIndicator = require('./LoadingIndicator')

class MeasureVoteBox extends Component {
  oninit() {
    const { measure } = this.props

    if (measure) {
      if (!measure.my_vote) {
        return this.fetchVote(measure)
      }
    }
  }
  onconnected() {
    if (this.state.loading !== 'vote') {
      return this.oninit()
    }
  }
  fetchVote(measure) {
    const { user } = this.state
    if (user) {
      this.setState({ loading: 'vote' })
      return this.api(`/votes?user_id=eq.${user.id}&delegate_rank=eq.-1&order=updated_at.desc`).then(votes => {
        const last_vote_public = votes[0] ? votes[0].public : true
        return this.api(`/votes?measure_id=eq.${measure.id}&user_id=eq.${user.id}&delegate_rank=eq.-1`).then(votes => {
          const my_vote = votes[0]
          return this.api(`/rpc/vote_power_for_measure`, {
            method: 'POST',
            body: JSON.stringify({ user_id: user.id, measure_id: measure.id })
          }).then((vote_power) => {
            return this.setState({
              loading: false,
              measures: {
                ...this.state.measures,
                [measure.short_id]: {
                  ...this.state.measures[measure.short_id],
                  vote_power,
                  my_vote,
                },
              },
              last_vote_public,
            })
          })
        })
      })
    }
    this.setState({ last_vote_public: true })
  }
  render() {
    const { loading } = this.state
    const { measure } = this.props
    return this.html`
      <div onconnected=${this}>
        ${!measure || loading === 'vote' ? LoadingIndicator.for(this) : MeasureVoteForm.for(this, { measure })}
      </div>
    `
  }
}

class MeasureVoteForm extends Component {
  onconnected() {
    if (this.location.query.action === 'add-argument') {
      window.scrollTo(0, document.getElementById('measure-vote-form').getBoundingClientRect().top)
    }
  }
  onsubmit(event, form) {
    event.preventDefault()

    const fetchMeasure = require('./MeasureDetailsPage').prototype.fetchMeasure
    const fetchComments = require('./MeasureDetailsPage').prototype.fetchComments
    const fetchTopComments = require('./MeasureDetailsPage').prototype.fetchTopComments
    const fetchConstituentVotes = require('./MeasureDetailsPage').prototype.fetchConstituentVotes

    const { measure } = this.props
    const { user, offices = [] } = this.state
    const { redirect } = this.location
    const { storage } = this
    const officesInChamber = offices.filter(({ chamber }) => chamber === measure.chamber)
    const officeId = officesInChamber[0] && officesInChamber[0].id

    if (!form.vote_position) {
      return { error: 'You must choose a position.' }
    }

    if (!user) {
      storage.set('vote_bill_id', measure.id)
      storage.set('vote_bill_short_id', measure.short_id)
      storage.set('vote_position', form.vote_position)
      storage.set('vote_public', form.public === 'true' ? 'true' : '')
      storage.set('vote_comment', form.comment)

      return redirect('/join')
    }

    this.setState({ saving_vote: true })

    this.setProps({ params: { username: measure.author_username, short_id: measure.short_id } })

    return this.api('/rpc/vote', {
      method: 'POST',
      body: JSON.stringify({
        user_id: user.id,
        measure_id: measure.id,
        vote_position: form.vote_position,
        comment: form.comment || null,
        public: form.public === 'true',
      }),
    })
    .then(() => fetchMeasure.call(this, measure.short_id))
    .then(() => fetchComments.call(this, measure.id, measure.short_id))
    .then(() => fetchTopComments.call(this, measure.id, measure.short_id))
    .then(() => fetchConstituentVotes.call(this, measure, officeId))
    .then(() => this.api(`/votes?measure_id=eq.${measure.id}&user_id=eq.${user.id}&delegate_rank=eq.-1`).then(votes => {
      if (this.isBrowser && window._loq) window._loq.push(['tag', 'Voted'])
      const my_vote = votes[0]
      this.setState({
        measures: {
          ...this.state.measures,
          [measure.short_id]: {
            ...this.state.measures[measure.short_id],
            vote_position: form.vote_position,
            delegate_rank: -1,
            delegate_name: null,
            my_vote,
          },
        },
        saving_vote: false,
        showMeasureVoteForm: !this.state.showMeasureVoteForm,
      })

      const type = measure.type === 'PN' ? 'nominations' : 'legislation'
      const username = measure.author_username ? `/${measure.author_username}` : ''
      const measureUrl = `${username}/${type}/${measure.short_id}`
      const elem = document.getElementById('measure-vote-form')

      // redirect back to measure page or vote page if on vote form page
      if (this.location.path.match(/\/(nominations|legislation)\/[\w-]+\/vote$/)) {
        if (form.comment) {
          return redirect(303, `${measureUrl}/votes/${my_vote.id}`)
        }
        return redirect(303, measureUrl)
      }

      // otherwise, scroll measure vote form into view (we are on measure page)
      if (elem) {
        const pos = elem.getBoundingClientRect()
        if (pos) {
          window.scrollTo(0, pos.y, { behavior: 'smooth' })
        } else {
          return redirect(303, measureUrl)
        }
      }
    }))
    .catch((error) => {
      console.error(error)
      return this.setState({ error: error.message, saving_vote: false })
    })
  }
  onclick(event) {
    const { measure } = this.props

    if (event.target.name === 'vote_position') {
      measure.my_vote = {
        ...measure.my_vote,
        vote_position: event.target.checked ? event.target.value : ''
      }
    }

    return this.setState({
      measures: {
        ...this.state.measures,
        [measure.short_id]: {
          ...this.state.measures[measure.short_id],
          ...measure,
        }
      },
    })
  }
  onchange(event) {
    const { measure } = this.props
    measure.my_vote = {
      ...measure.my_vote,
      public: event.target.value === 'true',
    }
    return this.setState({
      measures: {
        ...this.state.measures,
        [measure.short_id]: {
          ...this.state.measures[measure.short_id],
          ...measure,
        }
      },
    })
  }
  render() {
    const { error, last_vote_public, saving_vote } = this.state
    const { measure: l } = this.props
    const { my_vote: v = {} } = l
    const public_checked = v.hasOwnProperty('public') ? v.public : last_vote_public
    const vote_position = v.vote_position || l.vote_position
    return this.html`
      <form id="measure-vote-form" method="POST" style="margin-bottom: 2rem;" onsubmit=${this} action=${this} onconnected=${this}>
        <div class="field">
          <h4 class="title is-size-6">${!v.comment ? 'Add your argument' : 'Edit your argument'}:</h4>
        </div>
        ${v.id && !v.comment && public_checked ? [`
          <p class="notification">
            <span class="icon"><i class="fa fa-users"></i></span>
            ${v.id ? 'You cast' : 'You are casting'}
            a vote for <strong>${l.vote_power}</strong> people as their proxy.
            Consider including an explanation of your position.
          </p>
        `] : ''}
        ${error ? [`<div class="notification is-danger">${error}</div>`] : ''}
        <div class="field">
          <div class="columns is-gapless is-marginless">
            <div class="column">
              <div class="control">
                <label class="radio">
                  <input onclick=${this} type="radio" name="vote_position" value="yea" checked=${vote_position === 'yea' ? 'checked' : ''} />
                  Yea
                </label>
                <label class="radio">
                  <input onclick=${this} type="radio" name="vote_position" value="nay" checked=${vote_position === 'nay' ? 'checked' : ''} />
                  Nay
                </label>
                <label class="radio">
                  <input onclick=${this} type="radio" name="vote_position" value="abstain" checked=${vote_position === 'abstain' ? 'checked' : ''} />
                  Undecided
                </label>
              </div>
            </div>
            <div class="column">
              <div class="control has-text-right has-text-left-mobile has-text-grey is-size-7">
                ${[public_checked ? `
                    <span class="icon"><i class="fas fa-users"></i></span>You are casting
                    a vote for <span class="has-text-weight-semibold">${l.vote_power}</span> people as their proxy.
                ` : `
                    <span class="icon"><i class="fas fa-address-book"></i></span>You are casting
                    a private vote for yourself only. Only you can see it.
                `]}
              </div>
            </div>
          </div>
        </div>
        <div class="field">
          <div class="control">
            <textarea name="comment" autocomplete="off" class="textarea" placeholder="Add an argument. Why are you voting this way?" value=${v.comment || ''}></textarea>
          </div>
        </div>
        <div class="field is-horizontal">
          <div class="field is-grouped">
            <div class="control">
              <button class=${`button ${saving_vote ? 'is-loading' : ''}`} disabled=${saving_vote} type="submit">
                <span class="icon"><i class="fa fa-edit"></i></span>
                <span>${v.id ? 'Save' : 'Publish'}</span>
              </button>
            </div>
            <div class="control" style="flex-shrink: 1;">
              <div class="select">
                <select autocomplete="off" name="public" onchange=${this}>
                  <option value="true" selected=${public_checked}>Public (Vote Power: ${l.vote_power})</option>
                  <option value="false" selected=${!public_checked}>Private (Vote Power: 1)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <hr />
      </form>
    `
  }
}

MeasureVoteBox.MeasureVoteForm = MeasureVoteForm
module.exports = MeasureVoteBox
