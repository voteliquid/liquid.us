const { WWW_URL } = process.env
const Component = require('./Component')
const possessive = require('./Component').prototype.possessive
const { fetchConstituentVotes } = require('./MeasureDetailsPage').prototype

module.exports = class Endorse extends Component {
  render() {
    const { user, vote = {}, vote_position } = this.props
    return this.html`
      <div class="endorse">
        ${user && vote && user.id === vote.user_id
          ? YourVote.for(this, vote)
          : vote_position
            ? vote.endorsed
              ? Endorsed.for(this, vote)
              : AlreadyVoted.for(this, { vote, vote_position })
            : Unendorsed.for(this, vote)}
      </div>
    `
  }
}

class VoteShareButtons extends Component {
  onclick(event) {
    event.preventDefault()
    const ClipboardJS = require('clipboard')
    const clipboard = new ClipboardJS('.permalink')
    clipboard.on('success', () => {
      this.setProps({ copied2clipboard: true }).render(this.props)
      setTimeout(() => this.setProps({ copied2clipboard: false }).render(this.props), 2000)
    })
    clipboard.on('error', (error) => {
      console.log(error)
    })
  }
  render() {
    const ClipboardJS = typeof window === 'object' && require('clipboard')
    const { user } = this.state
    const { copied2clipboard, position, short_id, id, user_id, type } = this.props
    const comment_url = type === 'PN' ? `/nominations/${short_id}/votes/${id}` : `/legislation/${short_id}/votes/${id}`
    const share_url = `${WWW_URL}${comment_url}`
    let twitter_share_text = `Good argument! Click to show your support or explain why you disagree. ${share_url}`
    if (user && user.id === user_id) {
      twitter_share_text = `I'm voting ${position}. See why: ${share_url}`
    }
    return this.html`
      <div style="margin: .5rem 0;">
        <a class="is-small" href="${`https://twitter.com/intent/tweet?text=${twitter_share_text}`}" title="Share on Twitter">
          <span class="icon"><i class="fab fa-twitter"></i></span><span>Twitter</span>
        </a>
        <a class="is-small" href="${`https://www.facebook.com/sharer/sharer.php?u=${share_url}`}" title="Share on Facebook">
          <span class="icon"><i class="fab fa-facebook"></i></span><span>Facebook</span>
        </a>
        <link rel="stylesheet" href="/assets/bulma-tooltip.min.css">
        <a
          class="${`permalink ${ClipboardJS && ClipboardJS.isSupported() ? 'tooltip' : ''} is-small ${copied2clipboard ? 'is-tooltip-active is-tooltip-info' : ''}`}"
          data-tooltip="${copied2clipboard ? 'Copied URL to clipboard' : 'Copy URL to clipboard'}"
          data-clipboard-text="${share_url}"
          href="${share_url}"
          title="Permalink"
          onclick=${this}
        >
          <span class="icon"><i class="fa fa-link"></i></span><span>Permalink</span>
        </a>
      </div>
    `
  }
}

class Endorsed extends Component {
  onclick(event) {
    event.preventDefault()
    const { measures = {}, reps = [], user } = this.state
    if (!user) {
      return this.location.redirect('/join')
    }
    const { short_id, id: vote_id } = this.props
    const measure = measures[short_id]
    const repsInChamber = reps.filter(({ office_chamber }) => office_chamber === measure.chamber)
    const officeId = repsInChamber[0] && repsInChamber[0].office_id
    return this.api(`/endorsements?user_id=eq.${user.id}&vote_id=eq.${vote_id}`, {
      method: 'DELETE',
    })
    .then(() => fetchConstituentVotes.call(this, measure, officeId))
    .then(() => this.api(`/public_votes?id=eq.${vote_id}`))
    .then((votes) => {
      this.setState({
        measures: {
          ...this.state.measures,
          [short_id]: {
            ...this.state.measures[short_id],
            comment: votes[0] || this.state.measures[short_id].comment,
          }
        }
      })
    })
    .catch((error) => console.log(error))
  }
  render() {
    const { fullname, username } = this.props
    return this.html`
      <div class="box">
        <div class="container">
          <div class="level">
            <div class="level-left">
              <div class="has-text-centered has-text-left-mobile">
                <p class="has-text-left has-text-weight-bold">
                  Share ${fullname && username ? possessive(fullname) : 'their'} position to build support.
                </p>
                ${VoteShareButtons.for(this, this.props)}
              </div>
            </div>
            <div class="level-right">
              <a onclick=${this} href="#" class="button is-primary">
                <span>Endorsed</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    `
  }
}

class Unendorsed extends Component {
  onclick(event) {
    event.preventDefault()
    const { measures = {}, reps = [], user } = this.state
    const { short_id, id: vote_id } = this.props
    const measure = measures[short_id]
    if (!user) {
      this.storage.set('endorsed_vote_id', vote_id)
      this.storage.set('endorsed_measure_id', measure.id)
      this.storage.set('endorsed_url', `/legislation/${measure.short_id}/votes/${vote_id}`)
      return this.location.redirect('/join')
    }
    const repsInChamber = reps.filter(({ office_chamber }) => office_chamber === measure.chamber)
    const officeId = repsInChamber[0] && repsInChamber[0].office_id
    return this.api(`/endorsements?user_id=eq.${user.id}`, {
      method: 'POST',
      body: JSON.stringify({ user_id: user.id, vote_id, measure_id: measure.id }),
    })
    .then(() => fetchConstituentVotes.call(this, measure, officeId))
    .then(() => this.api(`/public_votes?id=eq.${vote_id}`))
    .then((votes) => {
      if (typeof window === 'object' && window._loq) window._loq.push(['tag', 'Voted'], ['tag', 'Endorsed'])
      this.setState({
        measures: {
          ...this.state.measures,
          [short_id]: {
            ...this.state.measures[short_id],
            comment: votes[0] || this.state.measures[short_id].comment,
          }
        }
      })
    })
    .catch((error) => console.log(error))
  }
  render() {
    const { fullname, short_id, type, username, author_username } = this.props
    const measureUrl = `${author_username ? `/${author_username}/` : '/'}${type === 'PN' ? 'nominations' : 'legislation'}/${short_id}/vote`
    return this.html`
      <div class="box">
        <div class="container">
          <div class="level">
            <div class="level-left">
              <div>
                <p class="has-text-left">
                  <span class="has-text-weight-bold">You haven't voted on this item.</span><br />
                  <span>Let your reps know you agree with ${fullname && username ? fullname : 'them'},</span>
                  <br />
                  <span>or <a href="${measureUrl}">add your own argument</a>.</span>
                </p>
              </div>
            </div>
            <div class="level-right">
              <a onclick=${this} href="#" class="button is-primary">
                <span>Endorse</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    `
  }
}

class AlreadyVoted extends Component {
  onclick(event) {
    event.preventDefault()
    const { measures = {}, reps = [], user } = this.state
    if (!user) {
      return this.location.redirect('/join')
    }
    const { short_id, id: vote_id } = this.props.vote
    const measure = measures[short_id]
    const repsInChamber = reps.filter(({ office_chamber }) => office_chamber === measure.chamber)
    const officeId = repsInChamber[0] && repsInChamber[0].office_id
    return this.api(`/endorsements?user_id=eq.${user.id}`, {
      method: 'POST',
      body: JSON.stringify({ user_id: user.id, vote_id, measure_id: measure.id }),
    })
    .then(() => fetchConstituentVotes.call(this, measure, officeId))
    .then(() => this.api(`/public_votes?id=eq.${vote_id}`))
    .then((votes) => {
      this.setState({
        measures: {
          ...this.state.measures,
          [short_id]: {
            ...this.state.measures[short_id],
            comment: votes[0] || this.state.measures[short_id].comment,
          }
        }
      })
    })
    .catch((error) => console.log(error))
  }
  render() {
    const { vote, vote_position } = this.props
    const { fullname, username } = vote
    return this.html`
      <div class="box">
        <div class="container">
          <div class="level">
            <div class="level-left">
              <p class="has-text-left">
                <span class="has-text-weight-bold">You already voted ${this.capitalize(vote_position)} on this item.</span><br />
                <span>Endorse ${fullname && username ? possessive(fullname) : 'their'} position instead?</span>
              </p>
            </div>
            <div class="level-right">
              <a onclick=${this} href="#" class="button is-primary">
                <span>Endorse</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    `
  }
}

class YourVote extends Component {
  render() {
    return this.html`
      <div class="box">
        <div class="container">
          <div class="level">
            <div class="level-left">
              <div class="has-text-centered has-text-left-mobile">
                <p class="has-text-left has-text-weight-bold">
                  Encourage others to endorse your position.
                </p>
                ${VoteShareButtons.for(this, this.props)}
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  }
}
