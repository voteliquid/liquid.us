const Component = require('./Component')
const LoadingIndicator = require('./LoadingIndicator')

module.exports = class LegislationVotePage extends Component {
  oninit() {
    return this.fetchVote()
  }
  onpagechange(oldProps) {
    if (oldProps.url !== this.props.url) {
      this.fetchVote()
    }
  }
  setBrowserTitle() {
    const { config, selected_bill } = this.state
    if (this.isBrowser) {
      const page_title = `Vote on ${selected_bill.short_title} ★ ${config.APP_NAME}`
      window.document.title = page_title
      window.history.replaceState(window.history.state, page_title, document.location)
    }
  }
  fetchVote() {
    const { selected_bill, user } = this.state
    const { params } = this.props

    this.setState({ loading_legislation: true })

    return this.api(`/legislation_detail?short_id=eq.${params.short_id}`)
      .then(bills => {
        const bill = bills[0]
        if (bill) {
          const page_title = `Vote on ${bill.short_title}`
          if (user) {
            return this.api(`/votes?user_id=eq.${user.id}&delegate_rank=eq.-1&order=updated_at.desc`).then(votes => {
              const last_vote_public = votes[0] && votes[0].public
              return this.api(`/votes?legislation_id=eq.${bill.id}&user_id=eq.${user.id}&delegate_rank=eq.-1`).then(votes => {
                bill.my_vote = votes[0]
                return this.api(`/rpc/vote_power_for_legislation`, {
                  method: 'POST',
                  body: JSON.stringify({ user_id: user.id, legislation_id: bill.id })
                }).then((bill_vote_power) => {
                  bill.vote_power = bill_vote_power
                  return this.setState({ page_title, selected_bill: { ...selected_bill, ...bill }, last_vote_public })
                })
              })
            })
          }
          return this.setState({ page_title, selected_bill: { ...selected_bill, ...bill } })
        }
        this.location.setStatus(404)
      })
      .then(() => this.setState({ legislation_query: false, loading_legislation: false }))
      .then(() => this.setBrowserTitle())
      .catch(error => ({ error, loading_legislation: false }))
  }
  render() {
    const { loading_legislation, selected_bill } = this.state
    return this.html`<div>
      ${selected_bill && !loading_legislation ? LegislationVoteContent.for(this) : LoadingIndicator.for(this)}
    </div>`
  }
}

class LegislationVoteContent extends Component {
  onsubmit(event, form) {
    event.preventDefault()

    const { selected_bill, user } = this.state
    const { redirect } = this.location
    const { storage } = this

    if (!form.vote_position) {
      return { error: 'You must choose a position.' }
    }

    if (!user) {
      storage.set('vote_bill_id', selected_bill.id)
      storage.set('vote_bill_short_id', selected_bill.short_id)
      storage.set('vote_position', form.vote_position)
      storage.set('vote_public', form.public === 'true' ? 'true' : '')
      storage.set('vote_comment', form.comment)

      return redirect('/join')
    }

    this.setState({ saving_vote: true })

    return this.api('/rpc/vote', {
      method: 'POST',
      body: JSON.stringify({
        user_id: user.id,
        legislation_id: selected_bill.id,
        vote_position: form.vote_position,
        comment: form.comment,
        public: form.public === 'true',
      }),
    })
    .then(() => {
      this.setState({ saving_vote: false })
      return redirect(303, `/legislation/${selected_bill.short_id}`)
    })
    .catch(error => {
      return { error: error.message, saving_vote: false }
    })
  }
  onclick(event) {
    const { selected_bill } = this.state

    if (event.target.name === 'vote_position') {
      selected_bill.my_vote = {
        ...selected_bill.my_vote,
        vote_position: event.target.checked ? event.target.value : ''
      }
    } else if (event.target.name === 'public') {
      selected_bill.my_vote = {
        ...selected_bill.my_vote,
        public: event.target.checked
      }
    }

    return { selected_bill }
  }
  render() {
    const { error, last_vote_public, legislation_query, saving_vote, selected_bill: l, user } = this.state
    const v = l.my_vote ? l.my_vote : {}
    const public_checked = v.hasOwnProperty('public') ? v.public : last_vote_public
    return this.html`
      <div class="container">
        <nav class="breadcrumb has-succeeds-separator is-left is-small" aria-label="breadcrumbs">
          <ul>
            <li><a class="has-text-grey" href="/">Home</a></li>
            <li><a class="has-text-grey" href="${legislation_query || '/legislation'}">Legislation</a></li>
            <li><a class="has-text-grey" href="${`/legislation/${l.short_id}`}">${l.type} ${l.number}</a></li>
            <li class="is-active"><a class="has-text-grey" href="#" aria-current="page">Vote</a></li>
          </ul>
        </nav>
      </div>
      <section class="section">
        <div class="container">
          ${(v.id && !user.cc_verified) ? [`
            <div class="notification is-info">
            <span class="icon"><i class="fa fa-exclamation-triangle"></i></span>
            <strong>Help hold your reps accountable!</strong><br />
            Your vote has been recorded, and we'll send it to your elected reps, but it won't be included in their Representation Grade until you <a href="/get_started">verify your identity</a>.
            </div>
          `] : ''}
          <div class="content">
            <h2>Vote on ${l.type} ${l.number} &mdash; ${l.short_title}</h2>
            ${l.vote_power > 1 ? [`<div class="notification"><span class="icon"><i class="fa fa-users"></i></span>You are casting a vote for <strong>${l.vote_power}</strong> people as their proxy. Consider including an explanation of your position.</div>`] : ''}
            <form method="POST" onsubmit=${this} action=${this}>
              ${error ? [`<div class="notification is-danger">${error}</div>`] : ''}
              <div class="field">
                <label for="vote_position" class="label has-text-grey">Position:</label>
                <div class="control">
                  <div class="button narrow-on-mobile">
                    <label class="radio">
                      <input onclick=${this} type="radio" name="vote_position" value="yea" checked=${v.vote_position === 'yea' ? 'checked' : ''} />
                      Yea
                    </label>
                  </div>
                  <div class="button narrow-on-mobile">
                    <label class="radio">
                      <input onclick=${this} type="radio" name="vote_position" value="nay" checked=${v.vote_position === 'nay' ? 'checked' : ''} />
                      Nay
                    </label>
                  </div>
                  <div class="button narrow-on-mobile">
                    <label class="radio">
                      <input onclick=${this} type="radio" name="vote_position" value="abstain" checked=${v.vote_position === 'abstain' ? 'checked' : ''} />
                      Undecided
                    </label>
                  </div>
                  <style>
                    label.radio {
                      padding: 0px 18px;
                    }
                    @media (max-width: 440px) {
                      .narrow-on-mobile {
                        padding: 0px 10px;
                      }
                      label.radio {
                        padding: 0px;
                      }
                    }
                  </style>
                </div>
              </div>
              <div class="field">
                <label for="comment" class="label has-text-grey">Comment:</label>
                <div class="control">
                  <textarea name="comment" autocomplete="off" class="textarea" placeholder="Why are you voting this way? (Optional)" value=${v.comment}></textarea>
                </div>
              </div>
              <div class="field">
                <div class="control">
                  <label class="checkbox">
                    <input onclick=${this} type="checkbox" name="public" value="true" checked=${public_checked ? 'checked' : ''} />
                    Public
                  </label>
                </div>
                <p class="is-size-7 has-text-grey">
                  ${public_checked
                    ? 'Your comment will be published with your name. It will also be listed on your profile.'
                    : 'Your comment will be published anonymously (your name will not be shown).'
                  }
                </p>
              </div>
              <div class="field">
                <div class="control">
                  <button class=${`button is-primary ${saving_vote ? 'is-loading' : ''}`} type="submit">
                    <span class="icon"><i class="fa fa-pencil-square-o"></i></span>
                    <span>Confirm Vote</span>
                  </button>
                </div>
              </div>
            </form>
            <br />
          </div>
        </div>
      </section>
    `
  }
}
