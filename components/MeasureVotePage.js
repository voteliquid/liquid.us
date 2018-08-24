const Component = require('./Component')
const LoadingIndicator = require('./LoadingIndicator')
const Sidebar = require('./MeasureDetailsSidebar')
const fetchMeasure = require('./MeasureDetailsPage').prototype.fetchMeasure
const fetchComments = require('./MeasureDetailsPage').prototype.fetchComments
const fetchTopComments = require('./MeasureDetailsPage').prototype.fetchTopComments

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
      ${measure && !loading_measure ? MeasureVoteForm.for(this, { measure }) : LoadingIndicator.for(this)}
    </div>`
  }
}

class MeasureVoteForm extends Component {
  onsubmit(event, form) {
    event.preventDefault()

    const { measure } = this.props
    const { measures = {}, user } = this.state
    const { redirect } = this.location
    const { storage } = this

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

    return this.api('/rpc/vote', {
      method: 'POST',
      body: JSON.stringify({
        user_id: user.id,
        measure_id: measure.id,
        vote_position: form.vote_position,
        comment: form.comment,
        public: form.public === 'true',
      }),
    })
    .then(() => fetchMeasure.call(this, measure.short_id))
    .then((measure) =>
      fetchComments.call(this, measure.id, measure.short_id)
      .then(() => fetchTopComments.call(this, measure.id, measure.short_id))
      .then(() => measure))
    .then((measure) => {
      if (this.isBrowser && window._loq) window._loq.push(['tag', 'Voted'])
      this.setState({
        measures: {
          ...measures,
          [measure.short_id]: {
            ...measures[measure.short_id],
            ...measure,
          },
        },
        saving_vote: false,
      })
      if (measure.type === 'PN') {
        return redirect(303, `/nominations/${measure.short_id}`)
      }
      return redirect(303, `/legislation/${measure.short_id}`)
    })
    .catch(error => {
      return { error: error.message, saving_vote: false }
    })
  }
  onclick(event) {
    const { measure } = this.props

    if (event.target.name === 'vote_position') {
      measure.my_vote = {
        ...measure.my_vote,
        vote_position: event.target.checked ? event.target.value : ''
      }
    } else if (event.target.name === 'public') {
      measure.my_vote = {
        ...measure.my_vote,
        public: event.target.checked
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
  render() {
    const { config, error, last_vote_public, legislation_query, saving_vote, user } = this.state
    const { measure: l } = this.props
    const v = l.my_vote ? l.my_vote : {}
    const public_checked = v.hasOwnProperty('public') ? v.public : last_vote_public
    return this.html`
      <section class="section">
        <div class="container">
          <nav class="breadcrumb has-succeeds-separator is-left is-small" aria-label="breadcrumbs">
            <ul>
              <li><a class="has-text-grey" href="/">${config.APP_NAME}</a></li>
              ${l.type !== 'PN' ? [`<li><a class="has-text-grey" href="${legislation_query || '/legislation'}">Legislation</a></li>`] : ''}
              <li><a class="has-text-grey" href="${`/${l.type === 'PN' ? 'nominations' : 'legislation'}/${l.short_id}`}">${l.introduced_at ? `${l.type} ${l.number}` : 'Measure Details'}</a></li>
              <li class="is-active"><a class="has-text-grey" href="#" aria-current="page">Vote</a></li>
            </ul>
          </nav>
          <div class="columns">
            <div class="column">
              ${(v.id && !user.cc_verified) ? [`
                <div class="notification is-info">
                  <span class="icon"><i class="fa fa-exclamation-triangle"></i></span>
                  <strong>Help hold your reps accountable!</strong><br />
                  Your vote has been recorded, and we'll send it to your elected reps, but it won't be included in their Representation Grade until you <a href="/get_started">verify your identity</a>.
                </div>
              `] : ''}
              <h2 class="title is-4 has-text-weight-normal">Vote on ${[l.introduced_at ? `${l.type} ${l.number} &mdash; ${l.title}` : l.title]}</h2>
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
                    <button class=${`button is-primary ${saving_vote ? 'is-loading' : ''}`} disabled=${saving_vote} type="submit">
                      <span class="icon"><i class="fa fa-pencil-square-o"></i></span>
                      <span>Confirm Vote</span>
                    </button>
                  </div>
                </div>
              </form>
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
