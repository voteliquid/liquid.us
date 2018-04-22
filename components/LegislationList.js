const Component = require('./Component')
const LoadingIndicator = require('./LoadingIndicator')

module.exports = class LegislationList extends Component {
  oninit() {
    if (!this.state.legislation) {
      return this.fetchLegislation()
    }
  }
  onpagechange() {
    this.fetchLegislation().then((newState) => this.setState(newState))
  }
  fetchLegislation(event) {
    if (event) event.preventDefault()

    const { user } = this.state
    const { query } = this.location

    this.setState({ loading_legislation: true, legislation_query: query })

    const terms = query.terms && query.terms.replace(/[^\w\d ]/g, '').replace(/(hr|s) (\d+)/i, '$1$2').replace(/(\S)\s+(\S)/g, '$1 & $2')
    const fts = terms ? `tsv=fts(english).${encodeURIComponent(terms)}&` : ''

    const orders = {
      upcoming: 'next_agenda_action_at.asc.nullslast,next_agenda_begins_at.asc.nullslast,next_agenda_category.asc.nullslast,last_action_at.desc.nullslast',
      new: 'introduced_at.desc',
      active: 'last_action_at.desc',
    }
    const order = orders[query.order || 'upcoming']
    const fields = [
      'short_title', 'number', 'type', 'short_id', 'id', 'status', 'sponsor_username', 'sponsor_first_name', 'sponsor_last_name',
      'sponsor_username_lower', 'introduced_at', 'last_action_at', 'yeas', 'nays', 'abstains', 'next_agenda_begins_at', 'next_agenda_action_at',
    ]
    if (user) fields.push('vote_position', 'delegate_rank', 'delegate_name', 'constituent_yeas', 'constituent_nays', 'constituent_abstains')
    const url = `/legislation_detail?select=${fields.join(',')}&${fts}order=${order}&limit=40`

    return this.api(url)
      .then(legislation => ({ legislation, loading_legislation: false }))
      .catch(error => ({ error, loading_legislation: false }))
  }
  render() {
    const { loading_legislation, legislation } = this.state

    return this.html`
      <div class="section">
        <div class="container">
          <h2 class="title is-5">U.S. Congress</h2>
          ${FilterTabs.for(this)}
          ${SearchForm.for(this)}
          ${loading_legislation ? LoadingIndicator.for(this) : legislation.map(o => LegislationListRow.for(this, o, `billitem-${o.id}`))}
          <link rel="stylesheet" href="/assets/bulma-tooltip.min.css">
          <style>
            .tooltip:hover::before {
              background: #000 !important;
            }
            .tooltip:hover::after {
              border-color: #000 transparent transparent transparent !important;
            }
            .highlight-hover:hover {
              background: #f6f8fa;
            }
          </style>
        </div>
      </div>
    `
  }
}

class FilterTabs extends Component {
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
          <li class="${!query.order || query.order === 'upcoming' ? 'is-active' : ''}"><a href="${`/legislation?order=upcoming&terms=${query.terms || ''}`}">Upcoming</a></li>
          <li class="${query.order === 'new' ? 'is-active' : ''}"><a href="${`/legislation?order=new&terms=${query.terms || ''}`}">New</a></li>
          <li class="${query.order === 'active' ? 'is-active' : ''}"><a href="${`/legislation?order=active&terms=${query.terms || ''}`}">Active</a></li>
        </ul>
      </div>
      <p class="has-text-grey is-size-6">${orderDescriptions[query.order || 'upcoming']}</p>
      <br />
    `
  }
}

class SearchForm extends Component {
  render() {
    const { loading_legislation } = this.state
    const { query } = this.location
    const terms = query.terms || ''

    return this.html`
      <form method="GET" action="/legislation">
        <input name="order" type="hidden" value="${query.order || 'upcoming'}" />
        <div class="field has-addons">
          <div class="control is-expanded">
            <input class="input" type="text" name="terms" placeholder="Examples: hr3440, health care, dream act" value="${terms}" />
          </div>
          <div class="control">
            <button class="button is-primary" type="submit">
              <span class="icon"><i class="fa fa-search"></i></span>
              <span>Search</span>
            </button>
          </div>
        </div>
      </form>
      <br />
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
    const s = this.props
    const next_action_at = s.next_agenda_action_at || s.next_agenda_begins_at

    const { abstains, nays, yeas } = s

    return this.html`
      <div class="card highlight-hover">
        <div class="card-content">
          <div class="columns">
            <div class="column">
              <h3><a href="${`/legislation/${s.short_id}`}">${s.short_title}</a></h3>
              <div class="is-size-7 has-text-grey">
                <strong class="has-text-grey">${s.type} ${s.number}</strong>
                &mdash;
                ${s.sponsor_first_name
                  ? [`Introduced by&nbsp;<a href=${`/${s.sponsor_username}`}>${s.sponsor_first_name} ${s.sponsor_last_name}</a>&nbsp;on ${(new Date(s.introduced_at)).toLocaleDateString()}`]
                  : [`Introduced on ${(new Date(s.introduced_at)).toLocaleDateString()}`]
                }
                <br />
                <strong class="has-text-grey">Status:</strong> ${s.status}
                <br />
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
              <div class="is-hidden-mobile">
                <br />
              </div>
              ${ yeas + nays + abstains > 5 ? [`
                <span class="icon tooltip" data-tooltip="This bill amends the Bank Holding Company Act of 1956 to exempt from the Volcker Rule banks with total assets: (1) of $10 billion or less, and (2) comprised of 5% or less of trading assets and liabilities. (The Volcker Rule prohibits banking agencies from engaging in proprietary trading or entering into certain relationships with hedge funds and private-equity funds.)">
                  <i class="fa fa-lg fa-info-circle has-text-info"></i>
                </span>
              `] : []}
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
