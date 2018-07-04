const Component = require('./Component')
const LoadingIndicator = require('./LoadingIndicator')

module.exports = class LegislationList extends Component {
  oninit() {
    if (!this.state.legislation) {
      return this.fetchLegislation()
    }
  }
  onpagechange(oldProps) {
    if (oldProps.url !== this.props.url) {
      Promise.resolve(this.fetchLegislation()).then((newState) => this.setState(newState))
    }
  }
  fetchLegislation(event) {
    if (event) event.preventDefault()

    const { legislation_query, user } = this.state
    const { query, url } = this.location

    if (url === legislation_query) return

    this.setState({ loading_legislation: true })

    const terms = query.terms && query.terms.replace(/[^\w\d ]/g, '').replace(/(hr|s) (\d+)/i, '$1$2').replace(/(\S)\s+(\S)/g, '$1 & $2')
    const fts = terms ? `&tsv=fts(simple).${encodeURIComponent(terms)}` : ''

    const orders = {
      upcoming: 'legislature_name.desc,next_agenda_action_at.asc.nullslast,next_agenda_begins_at.asc.nullslast,next_agenda_category.asc.nullslast,last_action_at.desc.nullslast',
      new: 'introduced_at.desc',
      active: 'last_action_at.desc',
    }

    const order = orders[query.order || 'upcoming']

    const hide_direct_votes = query.hide_direct_votes || this.storage.get('hide_direct_votes')
    const hide_direct_votes_query = hide_direct_votes === 'on' ? '&or=(delegate_rank.is.null,delegate_rank.neq.-1)' : ''

    const legislature = `&legislature_name=eq.${query.legislature || 'U.S. Congress'}`

    const fields = [
      'title', 'number', 'type', 'short_id', 'id', 'status',
      'sponsor_username', 'sponsor_first_name', 'sponsor_last_name',
      'introduced_at', 'last_action_at', 'yeas',
      'nays', 'abstains', 'next_agenda_begins_at', 'next_agenda_action_at',
      'summary', 'legislature_name', 'published'
    ]
    if (user) fields.push('vote_position', 'delegate_rank', 'delegate_name', 'constituent_yeas', 'constituent_nays', 'constituent_abstains')
    const api_url = `/legislation_detail?select=${fields.join(',')}${hide_direct_votes_query}${fts}${legislature}&introduced_at=not.is.null&published=is.true&order=${order}&limit=40`

    return this.api(api_url)
      .then(legislation => ({ legislation_query: url, legislation, loading_legislation: false }))
      .catch(error => ({ error, loading_legislation: false }))
  }
  render() {
    const { config, loading_legislation, legislation, reps } = this.state
    const legislatures = reps.some(({ office_short_name }) => office_short_name.slice(0, 2) === 'CA')
      ? ['U.S. Congress', 'California']
      : ['U.S. Congress']

    return this.html`
      <div class="section">
        <div class="container">
          <nav class="breadcrumb has-succeeds-separator is-left is-small" aria-label="breadcrumbs" style="margin-bottom: 1rem;">
            <ul>
              <li><a class="has-text-grey" href="/">${config.APP_NAME}</a></li>
              <li class="is-active"><a class="has-text-grey" href="/legislation" aria-current="page">Legislation</a></li>
            </ul>
          </nav>
          <div class="has-text-right has-text-left-mobile">${ProposeButton.for(this)}</div>
          ${FilterTabs.for(this)}
          ${FilterForm.for(this, { legislatures })}
          ${loading_legislation ? LoadingIndicator.for(this) : legislation.map(bill => LegislationListRow.for(this, { bill, legislatures }, `billitem-${bill.id}`))}
          <style>
            .highlight-hover:hover {
              background: #f6f8fa;
            }
            .summary-tooltip {
              position: relative;
            }
            .summary-tooltip .summary-tooltip-content {
              display: none;
              position: absolute;
              max-height: 222px;
            }
            .summary-tooltip .summary-tooltip-arrow {
              display: none;
              position: absolute;
            }
            .summary-tooltip:hover .summary-tooltip-content {
              display: block;
              background: hsl(0, 0%, 100%) !important;
              box-shadow: 0px 4px 15px hsla(0, 0%, 0%, 0.15);
              border: 1px solid hsl(0, 0%, 87%);
              color: #333;
              font-size: 14px;
              overflow: hidden;
              padding: .4rem .8rem;
              text-align: left;
              white-space: normal;
              width: 400px;
              z-index: 99999;
              top: auto;
              bottom: 50%;
              left: auto;
              right: 100%;
              transform: translate(-0.5rem, 50%);
            }
            .summary-tooltip:hover .summary-tooltip-arrow {
              border-color: transparent transparent transparent hsl(0, 0%, 100%) !important;
              z-index: 99999;
              position: absolute;
              display: inline-block;
              pointer-events: none;
              border-style: solid;
              border-width: .5rem;
              margin-left: -.5rem;
              margin-top: -.5rem;
              top: 50%;
              left: -1px;
            }
            .summary-tooltip:hover .has-text-grey-lighter {
              color: hsl(0, 0%, 75%) !important;
            }
          </style>
        </div>
      </div>
    `
  }
}

class FilterTabs extends Component {
  makeQuery(order) {
    const query = this.location.query
    const newQuery = Object.assign({}, query, { order, terms: query.terms || '' })
    return Object.keys(newQuery).map(key => {
      return `${key}=${newQuery[key]}`
    }).join('&')
  }
  render() {
    const { query } = this.location

    const orderDescriptions = {
      upcoming: 'Bills on the official agenda',
      new: 'Bills recently introduced',
      active: 'Bills recently acted upon',
    }

    return this.html`
      <div class="tabs">
        <ul>
          <li class="${!query.order || query.order === 'upcoming' ? 'is-active' : ''}"><a href="${`/legislation?${this.makeQuery('upcoming')}`}">Upcoming</a></li>
          <li class="${query.order === 'new' ? 'is-active' : ''}"><a href="${`/legislation?${this.makeQuery('new')}`}">New</a></li>
          <li class="${query.order === 'active' ? 'is-active' : ''}"><a href="${`/legislation?${this.makeQuery('active')}`}">Active</a></li>
        </ul>
      </div>
      <div class="content">
        <p class="has-text-grey is-size-6">${orderDescriptions[query.order || 'upcoming']}</p>
      </div>
    `
  }
}

class FilterForm extends Component {
  autosubmit() {
    document.querySelector('.filter-submit').click()
  }
  onclick(event) {
    const btn = document.querySelector('.filter-submit')
    if (btn.disabled) {
      event.preventDefault()
    } else {
      if (event.target && event.target.checked) {
        this.storage.set('hide_direct_votes', 'on')
      } else {
        this.storage.unset('hide_direct_votes')
      }
      btn.click()
    }
  }
  render() {
    const { legislatures } = this.props
    const { loading_legislation, user } = this.state
    const { query } = this.location
    const terms = query.terms || ''
    const hide_direct_votes = query.hide_direct_votes || this.storage.get('hide_direct_votes')

    return this.html`
      <form name="legislation_filters" method="GET" action="/legislation">
        <input name="order" type="hidden" value="${query.order || 'upcoming'}" />

        <div class="field has-addons">
          <div class=${`control ${legislatures.length > 1 ? '' : 'is-hidden'}`}>
            <div class="select">
              <select autocomplete="off" name="legislature" onchange=${this.autosubmit}>
                <option value="U.S. Congress" selected=${!query.legislature || query.legislature === 'U.S. Congress'}>U.S. Congress</option>
                <option value="California" selected=${query.legislature === 'California'}>California</option>
              </select>
            </div>
          </div>
          <div class="control is-expanded">
            <input class="input" type="text" name="terms" placeholder="Examples: hr3440, health care, dream act" value="${terms}" />
          </div>
          <div class="control">
            <button class="filter-submit button" disabled=${!!loading_legislation} type="submit">
              <span class="icon"><i class="fa fa-search"></i></span>
              <span>Search</span>
            </button>
          </div>
        </div>

        <div class=${`field is-grouped is-grouped-right ${user ? '' : 'is-hidden'}`}>
          <div class="control">
            <label class="checkbox has-text-grey">
              <input onclick=${this} type="checkbox" name="hide_direct_votes" checked=${!!hide_direct_votes}>
              Hide direct votes
            </label>
          </div>
        </div>
      </form>
      <div class="field">${!loading_legislation && terms ? SearchResultsMessage.for(this) : ''}</div>
    `
  }
}

class SearchResultsMessage extends Component {
  render() {
    const { legislation } = this.state
    const { query } = this.location
    const pluralFound = legislation.length === 1 ? 'bill' : 'bills'
    const new_query = query.order ? `?order=${query.order}` : ''

    return this.html`
      <div class="field is-size-7">
        ${legislation.length} ${pluralFound} found using term <strong>${query.terms}</strong>
        &mdash;
        <a href="${`/legislation${new_query}`}">Clear</a>
      </div>
    `
  }
}

class LegislationListRow extends Component {
  render() {
    const { bill: s, legislatures } = this.props
    const next_action_at = s.next_agenda_action_at || s.next_agenda_begins_at

    return this.html`
      <div class="card highlight-hover">
        <div class="card-content">
          <div class="columns">
            <div class="column">
              <h3><a href="${`/legislation/${s.short_id}`}">${s.title}</a></h3>
              <div class="is-size-7 has-text-grey">
                ${legislatures.length > 1 ? [`
                  <strong class="has-text-grey">${s.legislature_name}</strong>
                  &mdash;
                `] : ''}
                <strong class="has-text-grey">${s.type} ${s.number}</strong>
                &mdash;
                ${s.sponsor_first_name
                  ? [`Introduced by&nbsp;<a href=${`/${s.sponsor_username}`}>${s.sponsor_first_name} ${s.sponsor_last_name}</a>&nbsp;on ${(new Date(s.introduced_at)).toLocaleDateString()}`]
                  : [`Introduced on ${(new Date(s.introduced_at)).toLocaleDateString()}`]
                }
                ${s.summary ? [`
                  <p class="is-hidden-tablet"><strong class="has-text-grey">Has summary</strong></p>
                `] : []}
                <p><strong class="has-text-grey">Status:</strong> ${s.status}</p>
                ${next_action_at && [`
                  <strong class="has-text-grey">Next action:</strong>
                  Scheduled for House floor action ${!s.next_agenda_action_at ? 'during the week of' : 'on'} ${new Date(next_action_at).toLocaleDateString()}
                  <br />
                `]}
                <strong class="has-text-grey">Last action:</strong> ${new Date(s.last_action_at).toLocaleDateString()}
                <br />
                ${VoteCountOrTally.call(this, s)}
              </div>
            </div>
            <div class="column is-one-quarter has-text-right-tablet has-text-left-mobile">
              ${VoteButton.for(this, s, `votebutton-${s.id}`)}
              ${s.summary ? SummaryTooltipButton.for(this, s, `summarybutton-${s.id}`) : ''}
            </div>
          </div>
        </div>
      </div>
    `
  }
}

function votePositionClass(position) {
  if (position === 'yea') return 'is-success'
  if (position === 'nay') return 'is-danger'
  return ''
}

class VoteButton extends Component {
  render() {
    const s = this.props
    let voteBtnTxt = 'Vote'
    let voteBtnClass = 'button is-small is-outlined is-primary'
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
        voteBtnClass = `button is-small is-outlined ${votePositionClass(s.vote_position)}`
      }
      if (s.delegate_rank === -1) {
        voteBtnTxt = `You voted ${position}`
        voteBtnClass = `button is-small ${votePositionClass(s.vote_position)}`
      }
    }
    return this.html`<a style="white-space: inherit; height: auto;" class=${voteBtnClass} href=${`/legislation/${s.short_id}`}>
      <span class="icon" style="align-self: flex-start;"><i class=${voteBtnIcon}></i></span>
      <span class="has-text-weight-semibold">${voteBtnTxt}</span>
    </a>`
  }
}

function VoteCountOrTally(bill) {
  if (bill.vote_position && bill.delegate_rank === -1) {
    return VoteTally.for(this, bill, `votetally-${bill.id}`)
  }
  return VoteCount.for(this, bill, `votecount-${bill.id}`)
}

class VoteCount extends Component {
  render() {
    const { abstains, nays, yeas } = this.props
    return this.html`
      <span class="is-size-7 has-text-grey"><span class="has-text-weight-bold">Votes:</span> ${yeas + nays + abstains}</span>
    `
  }
}

class VoteTally extends Component {
  render() {
    const { constituent_abstains, constituent_nays, constituent_yeas } = this.props
    return this.html`
      <span class="is-size-7 has-text-grey"><span class="has-text-weight-bold">Votes:</span> Yea: ${constituent_yeas}, Nay: ${constituent_nays}, Abstain: ${constituent_abstains}</span>
    `
  }
}

class ProposeButton extends Component {
  render() {
    return this.html`
      <a class="button is-primary" href="/legislation/propose">
        <span class="icon"><i class="fa fa-file"></i></span>
        <span class="has-text-weight-semibold">Propose Legislation</span>
      </a>
    `
  }
}

class SummaryTooltipButton extends Component {
  render() {
    const { short_id, summary } = this.props

    return this.html`
      <a href="${`/legislation/${short_id}`}" class="is-hidden-mobile">
        <br />
        <br />
        <span class="icon summary-tooltip">
          <i class="fa fa-lg fa-info-circle has-text-grey-lighter"></i>
          <div class="summary-tooltip-content">${[summary]}</div>
          <div class="summary-tooltip-arrow"></div>
        </span>
      </a>
    `
  }
}
