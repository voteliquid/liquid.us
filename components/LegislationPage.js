const Component = require('./Component')
const timeAgo = require('from-now')
const LoadingIndicator = require('./LoadingIndicator')

const ago_opts = {
  seconds: 's',
  minutes: 'min',
  hours: 'h',
  days: 'd',
  weeks: 'w',
  months: 'month',
  years: 'y',
}

module.exports = class LegislationPage extends Component {
  oninit() {
    const { config, user } = this.state
    const { params } = this.props

    const fields = [
      'short_title', 'number', 'type', 'short_id', 'id', 'committee',
      'sponsor_username', 'sponsor_first_name', 'sponsor_last_name', 'status',
      'sponsor_username_lower', 'introduced_at', 'last_action_at', 'yeas', 'nays',
      'abstains', 'summary', 'number', 'congress', 'chamber'
    ]
    if (user) fields.push('vote_position', 'delegate_rank', 'delegate_name', 'constituent_yeas', 'constituent_nays')
    const url = `/legislation_detail?select=${fields.join(',')}&short_id=eq.${params.short_id}`

    this.setState({ loading_bill: true })

    return this.api(url)
      .then((bills) => {
        const selected_bill = bills[0]
        if (selected_bill) {
          return this.api(`/legislative_actions?select=*,references:legislative_references(*)&legislation_id=eq.${selected_bill.id}&order=occurred_at.desc`)
            .then(actions => {
              selected_bill.actions = actions

              if (this.isBrowser) {
                let page_title = `${config.APP_NAME} ★ ${selected_bill.short_title}`
                window.document.title = page_title
                window.history.replaceState(window.history.state, page_title, document.location)
              }

              return {
                loading_bill: false,
                page_title: selected_bill.short_title,
                page_description: `Vote directly on bills in Congress. We'll notify your representatives and grade them for listening / ignoring their constituents.`,
                selected_bill: { ...this.state.selected_bill, ...selected_bill },
              }
            })
        }
        this.location.setStatus(404)
        return { loading_bill: false }
      })
      .catch((error) => {
        this.location.setStatus(404)
        return { error, loading_bill: false }
      })
  }
  onpagechange() {
    this.oninit().then((newState) => this.setState(newState))
  }
  render() {
    const { loading_bill, selected_bill } = this.state

    return this.html`<div>${
      loading_bill
        ? LoadingIndicator.for(this)
        : selected_bill
          ? BillFoundPage.for(this)
          : BillNotFoundPage.for(this)
    }</div>`
  }
}

class BillNotFoundPage extends Component {
  render() {
    return this.html`
      <section class="hero is-fullheight is-dark">
        <div class="hero-body">
          <div class="container has-text-centered">
            <h1 class="title">${[this.location.path]} not found</h1>
            <h2 class="subtitle">Maybe you mistyped the URL?</h2>
          </div>
        </div>
      </section>
    `
  }
}

class BillFoundPage extends Component {
  render() {
    const { config, selected_bill: l, user } = this.state

    return this.html`
      <section class="section">
        <div class="container">
          ${(l.vote_position && !user.cc_verified) ? [`
            <div class="notification is-info">
              Your vote has been recorded, and we'll send it to your elected reps, but it won't be included in their Representation Grade until you <a href="/get_started">verify your identity</a>. Help hold your reps accountable!
            </div>
          `] : ''}
          <div class="content">
            <h2>${l.type} ${l.number} &mdash; ${l.short_title}</h2>
          </div>
          ${StatusTracker.for(this)}
          <p class="is-size-7 has-text-grey">
            ${l.sponsor_username
              ? [`Introduced by <a href=${`/${l.sponsor_username}`}>${l.sponsor_first_name} ${l.sponsor_last_name}</a> on ${(new Date(l.introduced_at)).toLocaleDateString()} &bullet; Last action on ${new Date(l.last_action_at).toLocaleDateString()}`]
              : [`Introduced on ${(new Date(l.introduced_at)).toLocaleDateString()} &bullet; last action on ${new Date(l.last_action_at).toLocaleDateString()}`]
            }
            &bullet; <a href=${`https://www.congress.gov/bill/${l.congress}th-congress/${l.chamber.toLowerCase()}-bill/${l.number}`} target="_blank">Bill details at congress.gov <span class="icon is-small"><i class="fa fa-external-link"></i></span></a>
          </p>
          <hr />
          <div class="content">
            <div class="columns">
              <div class="column">${BillSummary.for(this)}</div>
              <div class="column">
                <h3 class="title has-text-weight-normal is-size-5">Vote</h3>
                <p>${VoteButton.for(this, l, `votebutton-${l.id}`)}</p>
                ${l.vote_position
                ? [`
                  <p><span class="has-text-weight-bold">${l.constituent_yeas} Yea and ${l.constituent_nays} Nay</span> votes from verified constituents in your district</p>
                `]
                : [`
                  <p class="is-size-7">We'll notify <a href="/legislators">your representative</a> and hold them accountable by using your vote to calculate their <a href="https://blog.united.vote/2017/12/08/give-your-rep-an-f-introducing-united-legislator-grades/">representation score</a>.</p>
                  ${l.yeas + l.nays
                  ? [`
                    <p>${l.yeas + l.nays} people have voted on this bill. Join them.</p>
                  `]
                  : ''
                  }
                `]}
              </div>
            </div>
          </div>
          <hr />
          ${BillComments.for(this)}
        </div>
      </section>
    `
  }
}

class BillSummary extends Component {
  onclick(event) {
    event.preventDefault()
    this.setProps({ expanded: !this.props.expanded })
    this.render()
  }
  render() {
    const { expanded } = this.props
    const { selected_bill } = this.state
    const { chamber, congress, number, summary } = selected_bill

    return this.html`
      <style>
        .summary {
          max-height: 10rem;
          position: relative;
          overflow: hidden;
        }
        .summary .read-more {
          position: absolute;
          bottom: 1rem;
          left: 0;
          width: 100%;
          margin: 0;
          height: 3rem;

          /* "transparent" only works here because == rgba(0,0,0,0) */
          background-image: linear-gradient(to bottom, transparent, white);
        }
        .summary .read-more-link {
          background: white;
          display: block;
          width: 100%;
          height: 1rem;
          position: absolute;
          bottom: 0;
        }
      </style>
      <div class=${`${expanded || !summary ? '' : 'summary'}`}>
        <h3 class="title has-text-weight-normal is-size-5">Summary</h3>
        <div class="content">
          ${[summary || `<p>A summary is in progress.</p><p><a href="https://www.congress.gov/bill/${congress}th-congress/${chamber.toLowerCase()}-bill/${number}/text">Read full text of the bill at congress.gov <span class="icon is-small"><i class="fa fa-external-link"></i></span></a>`]}
        </div>
        <div class="read-more"></div>
        <a class="read-more-link is-size-7" href="#" onclick=${this}>
          ${summary
            ? [`<span class="icon is-small"><i class="${`fa fa-${expanded ? 'minus' : 'plus'}`}"></i></span> ${expanded ? 'Show less' : 'Show more'}`]
            : ''}
        </a>
      </div>
    `
  }
}

class VoteButton extends Component {
  votePositionClass() {
    const { vote_position: position } = this.props
    if (position === 'yea') return 'is-success'
    if (position === 'nay') return 'is-danger'
    return ''
  }
  render() {
    const s = this.props

    let voteBtnTxt = 'Vote on this bill'
    let voteBtnClass = 'button is-primary'
    let voteBtnIcon = 'fa fa-pencil-square-o'

    if (s.vote_position) {
      const position = `${s.vote_position[0].toUpperCase()}${s.vote_position.slice(1)}`
      if (s.vote_position === 'yea') voteBtnIcon = 'fa fa-check'
      if (s.vote_position === 'nay') voteBtnIcon = 'fa fa-times'
      if (s.vote_position === 'abstain') voteBtnIcon = 'fa fa-circle-o'
      if (s.delegate_rank > -1) {
        if (s.delegate_name) {
          voteBtnTxt = `Inherited ${position} vote from ${s.delegate_name}`
        } else {
          voteBtnTxt = `Inherited ${position} vote from proxy`
        }
        voteBtnClass = `button is-outlined ${this.votePositionClass()}`
      }
      if (s.delegate_rank === -1) {
        voteBtnTxt = `You voted ${position}`
        voteBtnClass = `button ${this.votePositionClass()}`
      }
    }
    return this.html`<a style="white-space: inherit; height: auto;" class=${voteBtnClass} href=${`/legislation/${s.short_id}/vote`}>
      <span class="icon"><i class=${voteBtnIcon}></i></span>
      <span class="has-text-weight-semibold">${voteBtnTxt}</span>
    </a>`
  }
}

class BillComments extends Component {
  render() {
    return this.html`
      <div class="columns">
        <div class="column">
          <h3 class="is-size-5">Comments in favor</h3>
          <br />
          ${CommentsColumn.for(this, { position: 'yea' }, 'comments-yea')}
        </div>
        <div class="column">
          <h3 class="is-size-5">Comments against</h3>
          <br />
          ${CommentsColumn.for(this, { position: 'nay' }, 'comments-nay')}
        </div>
      </div>
    `
  }
}

class CommentsColumn extends Component {
  oninit() {
    const { position } = this.props
    const { selected_bill } = this.state

    if (selected_bill[`${position}_comments`]) return

    return this.api(`/public_votes?legislation_id=eq.${selected_bill.id}&comment=not.eq.&comment=not.is.null&position=eq.${position}`).then(comments => {
      return { selected_bill: { ...this.state.selected_bill, [`${position}_comments`]: comments } }
    })
  }
  render() {
    const { position } = this.props
    const { selected_bill } = this.state
    const comments = selected_bill[`${position}_comments`] || []

    return this.html`
      <div>
        ${comments.length
          ? comments.map(c => Comment.for(this, c, `comment-${c.id}`))
          : [`<p class="has-text-grey is-size-7">No comments ${position === 'yea' ? 'in favor' : 'against'}.</p>`]
        }
      </div>
    `
  }
}

class Comment extends Component {
  render() {
    const { comment, created_at, endorsements, fullname, id, username } = this.props
    const { user } = this.state
    const avatarURL = this.avatarURL(comment)

    return this.html`
      <div class="card is-small">
          <div style="box-shadow: 0 1px 2px rgba(10,10,10,.1); padding: .75rem;">
            <div class="level">
              <div class="level-left">
                <div class="level-item">
                  ${username
                  ? avatarURL
                    ? [`
                        <div class="media">
                          <div class="media-left">
                            <p class="image is-32x32">
                              <a href=${username}>
                                <img src=${avatarURL} alt="avatar" class="avatar" />
                              </a>
                            </p>
                          </div>
                          <div class="media-content" style="align-self: center;">
                            <a href="/${username}">${fullname} <span class="has-text-grey-light">@${username}</span></a>
                          </div>
                        </div>
                    `]
                    : [`
                      <a href="/${username}">${fullname} <span class="has-text-grey-light">@${username}</span></a>
                    `]
                  : [`
                    <span class="has-text-grey-light">Anonymous</span>
                  `]}
                </div>
              </div>
              <div class="level-right">
                <div class="level-item">
                  ${user
                    ? CommentEndorseButton.for(this, this.props, `endorsebtn-${id}`)
                    : [`
                      <span class="icon"><i class="fa fa-thumbs-o-up"></i></span>
                      <span>${endorsements}</span>
                    `]
                  }
                  <span class="has-text-grey-light">&nbsp;&bullet;&nbsp;</span>
                  <span class="has-text-grey-light">${timeAgo(`${created_at}Z`, ago_opts)} ago</span>
                </div>
            </div>
          </div>
        </div>
        <div class="card-content">${comment}</div>
      </div>
      <br />
    `
  }
}

class CommentEndorseButton extends Component {
  onsubmit(event) {
    event.preventDefault()

    const { endorsed, legislation_id, position, id } = this.props
    const { selected_bill, user } = this.state

    if (endorsed) {
      return this.api(`/comment_endorsements?user_id=eq.${user.id}&legislation_id=eq.${legislation_id}&vote_id=eq.${id}`, {
        method: 'DELETE',
      }).then(() => {
        selected_bill[`${position}_comments`] = selected_bill[`${position}_comments`].map(comment => {
          if (comment.id === id) {
            comment.endorsements -= 1
            comment.endorsed = false
          }
          return comment
        })
        return { selected_bill }
      })
    }

    return this.api('/comment_endorsements', {
      headers: { Prefer: 'return=representation' },
      method: 'POST',
      body: JSON.stringify({
        vote_id: id,
        user_id: user.id,
        legislation_id,
      })
    }).then(() => {
      selected_bill[`${position}_comments`] = selected_bill[`${position}_comments`].map(comment => {
        if (comment.id === id) {
          comment.endorsements += 1
          comment.endorsed = true
        }
        return comment
      })
      return { selected_bill }
    })
  }
  render() {
    const { endorsements } = this.props

    return this.html`
      <form class="has-text-right" method="POST" onsubmit=${this} action=${this}>
        <style>
          .button.is-text {
            padding: 0!important;
            border: none;
            color: inherit;
            height: 1rem;
            text-decoration: none;
          }
          .button.is-text:hover, .button.is-text:active {
            color: inherit;
            border: none;
            background: transparent;
          }
        </style>
          <button type="submit" class="button is-text">
            <span class="icon is-small"><i class="fa fa-thumbs-o-up"></i></span>
            <span>${endorsements}</span>
          </button>
      </form>
    `
  }
}

class StatusTracker extends Component {
  render() {
    const { selected_bill } = this.state
    const filtered = [].concat(selected_bill.actions).reverse().sort((a, b) => {
      const acode = Number(a.action_code)
      const bcode = Number(b.action_code)
      if (acode > bcode) return 1
      if (acode < bcode) return -1
      return 0
    }).map(action => {
      const code = Number(action.action_code)
      if (code === 8000) return 'Passed House'
      if (code === 17000) return 'Passed Senate'
      if (code === 9000) return 'Failed House'
      if (code === 18000) return 'Failed Senate'
      if (code >= 19500 && code <= 24000) return 'Resolving Differences'
      if (code === 28000 || code === 29000) return 'To President'
      if (code >= 30000 && code <= 35000) return 'Veto Actions'
      if (code === 36000 || code === 41000) return 'Enacted'
      return null
    })
    .filter(action => !!action)
    .reduce((b, a) => {
      if (b[b.length - 1].step !== a) {
        b.push({ selected: true, step: a })
      }
      return b
    }, [{ selected: true, step: 'Introduced' }])
    const chambers_passed = filtered.reduce((b, a) => {
      if (a.step === 'Passed House') return { house: true, senate: b.senate }
      if (a.step === 'Passed Senate') return { house: b.house, senate: true }
      return b
    }, { house: false, senate: false })
    if (filtered[filtered.length - 1].step === 'Introduced') {
      filtered.push({ step: selected_bill.origin_chamber === 'House' ? 'Passed Senate' : 'Passed House' })
      filtered.push({ step: selected_bill.origin_chamber === 'House' ? 'Passed House' : 'Passed Senate' })
      filtered.push({ step: 'Resolving Differences' })
    } else if ((filtered[filtered.length - 1].step.slice(7) === 'House' || filtered[filtered.length - 1].step.slice(7) === 'Senate')) {
      if (chambers_passed.house && chambers_passed.senate) {
        filtered.push({ step: 'Resolving Differences' })
      } else {
        if (chambers_passed.house) {
          filtered.push({ step: 'Pass Senate' })
        } else if (chambers_passed.senate) {
          filtered.push({ step: 'Pass House' })
        } else if (selected_bill.origin_chamber === 'House') {
          filtered.push({ step: 'Passed Senate' }, { step: 'Passed House' })
        } else {
          filtered.push({ step: 'Passed House' }, { step: 'Passed Senate' })
        }
        filtered.push({ step: 'Resolving Differences' })
      }
    }
    if (filtered[filtered.length - 1].step === 'Resolving Differences') {
      filtered.push({ step: 'To President' })
    }
    if (filtered[filtered.length - 1].step === 'To President') {
      filtered.push({ step: 'Enacted' })
    }
    return this.html`
      <style>
      .status_tracker {
        list-style: none;
        display: inline-block;
        margin-left: 1rem;
        margin-top: -.5rem;
        margin-bottom: .5rem;
      }
      .status_tracker .step {
        float: left;
        padding-top: .5rem;
      }
      .status_tracker .step:first-child {
        margin-left: -1rem;
      }
      .status_tracker .step .step_label {
        display: block;
        background: rgba(0, 0, 0, 0.06);
        text-decoration: none;
        position: relative;
        height: 2rem;
        line-height: 2rem;
        padding: 0 .7rem 0 0;
        text-align: center;
        margin-right: 1.2rem;
      }
      .status_tracker .step.fulfilled .step_label {
        background: rgba(0, 0, 0, 0.09);
      }
      .status_tracker .step:first-child .step_label {
        padding-left: .7rem;
        border-radius: 4px 0 0 4px;
      }
      .status_tracker .step:first-child .step_label:before {
        border: none;
      }
      .status_tracker .step:last-child .step_label {
        padding-right: 1rem;
        border-radius: 0 4px 4px 0;
      }
      .status_tracker .step:last-child .step_label:after {
        border: none;
      }
      .status_tracker .step .step_label:before, .status_tracker .step .step_label:after {
        content: "";
        position: absolute;
        top: 0;
        border: 0 solid rgba(0, 0, 0, 0.06);
        border-width: 1rem .5rem;
        width: 0;
        height: 0;
      }
      .status_tracker .step .step_label:before {
        left: -1rem;
        border-left-color: transparent;
      }
      .status_tracker .step .step_label:after {
        left: 100%;
        border-color: transparent;
        border-left-color: rgba(0, 0, 0, 0.06);
      }
      .status_tracker .step.fulfilled .step_label {
        background-color: rgba(0, 0, 0, 0.09);
      }
      .status_tracker .step.fulfilled .step_label:before {
        border-color: rgba(0, 0, 0, 0.09);
        border-left-color: transparent;
      }
      .status_tracker .step.fulfilled .step_label:after {
        border-left-color: rgba(0, 0, 0, 0.09);
      }
      </style>
      <div class="is-size-7 status_tracker">
        ${[filtered.map(a => `<div class="${`step ${a.selected ? 'fulfilled' : 'has-text-grey'}`}"><div class="step_label"><span class="icon"><i class="fa ${a.selected ? 'fa-check-circle-o' : 'fa-circle-o'}"></i></span>${a.step}</div></div>`).join('')]}
      </div>
    `
  }
}
