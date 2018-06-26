const BillTitle = require('./BillTitle')
const Component = require('./Component')
const Comment = require('./Comment')
const LoadingIndicator = require('./LoadingIndicator')

module.exports = class LegislationPage extends Component {
  oninit() {
    const { config } = this.state
    const { params } = this.props

    const url = `/legislation_detail?short_id=eq.${params.short_id}`

    this.setState({ loading_bill: true })

    return this.api(url).then((bills) => {
      const selected_bill = bills[0]

      if (selected_bill) {
        if (this.isBrowser) {
          const page_title = `${selected_bill.title} ★ ${config.APP_NAME}`
          window.document.title = page_title
          window.history.replaceState(window.history.state, page_title, document.location)
        }

        return this.fetchComments(selected_bill).then(({ yea_comments, nay_comments }) => {
          selected_bill.yea_comments = yea_comments
          selected_bill.nay_comments = nay_comments
          return {
            loading_bill: false,
            page_title: selected_bill.title,
            page_description: `Vote directly on legislative bills. We'll notify your representatives and grade them for how well they listen to their constituents.`,
            selected_bill: { ...bills[selected_bill.short_id], ...selected_bill },
            bills: { ...bills, [selected_bill.short_id]: selected_bill },
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
  fetchComments(selected_bill) {
    return this.api(`/public_votes?legislation_id=eq.${selected_bill.id}&comment=not.eq.&comment=not.is.null&order=endorsements.desc.nullslast`)
    .then(comments => ({
      yea_comments: comments.filter(({ position }) => position === 'yea'),
      nay_comments: comments.filter(({ position }) => position === 'nay'),
    }))
  }
  onpagechange() {
    const { loading_bill, selected_bill } = this.state
    if (!loading_bill && selected_bill) {
      this.oninit().then((newState) => this.setState(newState))
    }
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
            <h1 class="title">Can't find ${[this.location.path]}</h1>
            <h2 class="subtitle">Maybe the URL is mistyped?</h2>
          </div>
        </div>
      </section>
    `
  }
}

class BillFoundPage extends Component {
  render() {
    const { config, legislation_query, selected_bill: l, user } = this.state

    const own_comment = user && l.yea_comments.concat(l.nay_comments).reduce((b, a) => {
      if (a.user_id === user.id) return a
      return b
    }, false)

    const bill_id = l.introduced_at ? `${l.type} ${l.number}` : l.title

    return this.html`
      <section class="section">
        <div class="container">
          <nav class="breadcrumb has-succeeds-separator is-left is-small" aria-label="breadcrumbs">
            <ul>
              <li><a class="has-text-grey" href="/">${config.APP_NAME}</a></li>
              <li><a class="has-text-grey" href="${legislation_query || '/legislation'}">Legislation</a></li>
              <li class="is-active"><a class="has-text-grey" href="#" aria-current="page">${bill_id}</a></li>
            </ul>
          </nav>
          ${(user && l.author_id === user.id && !l.published) ? [`
            <div class="notification">
              <span class="icon"><i class="fa fa-exclamation-triangle"></i></span>
              Your proposed legislation is unpublished, so only you can see it. <a href="/legislation/${l.short_id}/edit">Edit</a> to make changes or publish.
            </div>
          `] : ''}
          ${(l.vote_position && !user.cc_verified) ? [`
            <div class="notification is-info">
              <span class="icon"><i class="fa fa-exclamation-triangle"></i></span>
              <strong>Help hold your reps accountable!</strong><br />
              Your vote has been recorded, and we'll send it to your elected reps, but it won't be included in their Representation Grade until you <a href="/get_started">verify your identity</a>.
            </div>
          `] : ''}
          ${user && l.author_id === user.id && !l.published
            ? [`
                <div class="is-pulled-right">
                  <a href="${`/legislation/${l.short_id}/edit`}" class="button is-small">
                    <span class="icon is-small"><i class="fa fa-pencil"></i></span><span>Edit</span>
                  </a>
                  <a href="${`/legislation/${l.short_id}/edit`}" class="button is-small is-danger is-outlined">Unpublished</a>
                </div>
              `]
            : ''}
          ${BillTitle.for(this)}
          <hr />
          <div class="content">
            <div class="columns">
              <div class="column">${BillSummary.for(this)}</div>
              <div class="column">
                <p>${VoteButton.for(this, l, `votebutton-${l.id}`)}</p>
                ${l.vote_position
                ? [`
                  <p><span class="has-text-weight-bold">${l.constituent_yeas} Yea and ${l.constituent_nays} Nay</span> votes from verified constituents in your district</p>
                `]
                : [`
                  ${l.yeas + l.nays
                    ? `<p>${l.yeas + l.nays} people have voted on this bill. Join them.</p>`
                    : ''}
                  <p class="is-size-7">We'll notify <a href="/legislators">your representative</a> and hold them accountable by using your vote to calculate their <a href="https://blog.united.vote/2017/12/08/give-your-rep-an-f-introducing-united-legislator-grades/">representation score</a>.</p>
                `]}
              </div>
            </div>
          </div>
          ${own_comment ? Comment.for(this, own_comment, `own-comment-${own_comment.id}`) : ''}
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
        <div class="content">
          ${[summary ? summary.replace(/\n/g, '<br />') : `<p>A summary is in progress.</p><p><a href="https://www.congress.gov/bill/${congress}th-congress/${chamber === 'Lower' ? 'house' : 'senate'}-bill/${number}/text" target="_blank">Read full text of the bill at congress.gov <span class="icon is-small"><i class="fa fa-external-link"></i></span></a>`]}
        </div>
        <div class="${`read-more ${summary && summary.length > 512 ? '' : 'is-hidden'}`}"></div>
        <a class="${`read-more-link is-size-7 ${summary && summary.length > 512 ? '' : 'is-hidden'}`}" href="#" onclick=${this}>
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
          ${CommentsColumn.for(this, { position: 'yea' }, 'comments-yea')}
        </div>
        <div class="column">
          ${CommentsColumn.for(this, { position: 'nay' }, 'comments-nay')}
        </div>
      </div>
    `
  }
}

class CommentsColumn extends Component {
  render() {
    const { position } = this.props
    const { selected_bill } = this.state
    const comments = selected_bill[`${position}_comments`] || []

    return this.html`
      ${comments.length
        ? comments.map(c => Comment.for(this, c, `comment-${c.id}`))
        : [`<p class="has-text-grey-light">No comments ${position === 'yea' ? 'in favor' : 'against'}. Vote on the bill to leave a comment.</p>`]
      }
    `
  }
}
