const { api, html, preventDefault, redirect } = require('../helpers')
const activityIndicator = require('./ActivityIndicator')

module.exports = {
  init: ({ legislatures, location = {}, measures = {}, measuresList = [], measuresQuery, storage, user }) => [{
    location,
    legislatures,
    loading: true,
    measures,
    measuresList,
    measuresQuery,
  }, initialize(measuresQuery, location, storage, user)],
  update: (event, state) => {
    switch (event.type) {
      case 'error':
        return [{ ...state, loading: false }]
      case 'filterFormSubmitted':
        return [{ ...state, loading: true }, preventDefault(event.event)]
      case 'receivedMeasures':
        return [{
          ...state,
          loading: false,
          measures: { ...state.measures, ...event.measures },
          measuresList: event.measuresList,
          measuresQuery: state.location.url,
        }]
      case 'redirected':
        return [state, redirect(event.url, event.status)]
      case 'loaded':
      default:
        return [{ ...state, loading: false }]
    }
  },
  view: (state, dispatch) => {
    const { loading, measuresList, location, measures } = state
    const { query } = location
    return html()`
      <div class="section">
        <div class="container is-widescreen">
          <div class="has-text-right has-text-left-mobile">${proposeButton()}</div>
          ${filterTabs(state, dispatch)}
          ${loading ? activityIndicator() :
            (!measuresList.length ? noBillsMsg(query.order, query) : measuresList.map((short_id) => measureListRow(measures[short_id])))}
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
  },
}


const toggleRecentlyIntroduced = (storage) => (event) => {
  const btn = document.querySelector('.filter-submit')
  if (btn.disabled) {
    event.preventDefault()
  } else {
    if (event.currentTarget && event.currentTarget.checked) {
      storage.set('recently_introduced', 'on')
    } else {
      storage.unset('recently_introduced')
    }
    btn.click()
  }
}
const toggleBills = (storage) => (event) => {
  const btn = document.querySelector('.filter-submit')
  if (btn.disabled) {
    event.preventDefault()
  } else {
    if (event.currentTarget && event.currentTarget.checked) {
      storage.set('bills', 'on')
    } else {
      storage.unset('bills')
    }
    btn.click()
  }
}
const toggleNominations = (storage) => (event) => {
  const btn = document.querySelector('.filter-submit')
  if (btn.disabled) {
    event.preventDefault()
  } else {
    if (event.currentTarget && event.currentTarget.checked) {
      storage.set('nominations', 'on')
    } else {
      storage.unset('nominations')
    }
    btn.click()
  }
}
const toggleLiquidProposals = (storage) => (event) => {
  const btn = document.querySelector('.filter-submit')
  if (btn.disabled) {
    event.preventDefault()
  } else {
    if (event.currentTarget && event.currentTarget.checked) {
      storage.set('from_liquid', 'on')
    } else {
      storage.unset('from_liquid')
    }
    btn.click()
  }
}
const toggleIntroducedInLeg = (storage) => (event) => {
  const btn = document.querySelector('.filter-submit')
  if (btn.disabled) {
    event.preventDefault()
  } else {
    if (event.currentTarget && event.currentTarget.checked) {
      storage.set('from_leg_body', 'on')
    } else {
      storage.unset('from_leg_body')
    }
    btn.click()
  }
}
const toggleCommitteeActions = (storage) => (event) => {
  const btn = document.querySelector('.filter-submit')
  if (btn.disabled) {
    event.preventDefault()
  } else {
    if (event.currentTarget && event.currentTarget.checked) {
      storage.set('committee_action', 'on')
    } else {
      storage.unset('committee_action')
    }
    btn.click()
  }
}
const toggleExecActions = (storage) => (event) => {
  const btn = document.querySelector('.filter-submit')
  if (btn.disabled) {
    event.preventDefault()
  } else {
    if (event.currentTarget && event.currentTarget.checked) {
      storage.set('exec_action', 'on')
    } else {
      storage.unset('exec_action')
    }
    btn.click()
  }
}
const toggleFloorActions = (storage) => (event) => {
  const btn = document.querySelector('.filter-submit')
  if (btn.disabled) {
    event.preventDefault()
  } else {
    if (event.currentTarget && event.currentTarget.checked) {
      storage.set('floor_action', 'on')
    } else {
      storage.unset('floor_action')
    }
    btn.click()
  }
}
const updateFilter = (event, location, dispatch) => {
  event.preventDefault()
  const formData = require('parse-form').parse(event.target).body
  const formUrl = `${location.path}?${Object.keys(formData).map((key) => {
    return `${key}=${formData[key]}`
  }).join('&')}`
  dispatch({ type: 'redirected', url: formUrl })
}

const filterForm = (geoip, legislatures, storage, location, user, dispatch) => {
  const recently_introduced = location.query.recently_introduced || storage.get('recently_introduced')
  const from_liquid = location.query.from_liquid || storage.get('from_liquid')
  const from_leg_body = location.query.from_leg_body || storage.get('from_leg_body')
  const committee_action = location.query.committee_action || storage.get('committee_action')
  const floor_action = location.query.floor_action || storage.get('floor_action')
  const exec_action = location.query.exec_action || storage.get('exec_action')
  const bills = location.query.floor_action || storage.get('bills')
  const nominations = location.query.exec_action || storage.get('nominations')

  return html()`
    <form name="legislation_filters" class="is-inline-block" method="GET" action="/legislation" onsubmit="${(e) => updateFilter(e, location, dispatch)}">
      <input name="order" type="hidden" value="${location.query.order || 'all'}" />
      <div class="field is-grouped is-grouped-right">
        <div class="${`control ${user ? '' : 'is-hidden'}`}">
        <label class="checkbox has-text-grey">
            <input onclick=${toggleRecentlyIntroduced(storage)} type="checkbox" name="recently_introduced" checked=${!!recently_introduced}>
            Introduced
          </label>
        <label class="checkbox has-text-grey">
        <input onclick=${toggleCommitteeActions(storage)} type="checkbox" name="committee_action" checked=${!!committee_action}>
        Committee
        </label>
        <label class="checkbox has-text-grey">
        <input onclick=${toggleFloorActions(storage)} type="checkbox" name="floor_action" checked=${!!floor_action}>
        Floor
        </label>
        <label class="checkbox has-text-grey">
        <input onclick=${toggleExecActions(storage)} type="checkbox" name="exec_action" checked=${!!exec_action}>
        Executive
        </label>
          <label class="checkbox has-text-grey">
            <input onclick=${toggleLiquidProposals(storage)} type="checkbox" name="from_liquid" checked=${!!from_liquid}>
            Liquid Proposals
          </label>
          <label class="checkbox has-text-grey">
          <input onclick=${toggleIntroducedInLeg(storage)} type="checkbox" name="from_leg_body" checked=${!!from_leg_body}>
          Imported
          </label>
          <label class="checkbox has-text-grey">
          <input onclick=${toggleBills(storage)} type="checkbox" name="bills" checked=${!!bills}>
          Bills
          </label>
          <label class="checkbox has-text-grey">
          <input onclick=${toggleNominations(storage)} type="checkbox" name="nominations" checked=${!!nominations}>
          Nominations
          </label>

        </div>

        <button type="submit" class="filter-submit is-hidden">Update</button>
      </div>
      ${(!user || !user.address) && geoip ? [addAddressNotification(geoip, user)] : []}
    </form>
  `
}

const addAddressNotification = (geoip = {}, user) => {
  return `
    <p class="help">
      We guessed your location is <strong>${geoip.city}, ${geoip.regionName}.</strong><br />
      But this is only an approximation. <strong><a href="${user ? '/get_started/basics' : '/join'}">${user ? 'Go here' : 'Join'} to set your address</a></strong>.
    </p>
  `
}

const makeFilterQuery = (order, query) => {
  const newQuery = Object.assign({}, query, { order, terms: (query.terms || '') })
  return Object.keys(newQuery).filter((key) => key).map(key => {
    return `${key}=${newQuery[key]}`
  }).join('&')
}

const filterTabs = ({ geoip, legislatures, location, storage, user }, dispatch) => {
  const { query } = location
  const orderDescriptions = {
    all: 'All levels of government',
    congress: 'Congressional bills and nominations',
    state: `Statewide proposals`,
    city: 'City proposals',
  }

  const userCity = user && user.address ? user.address.city : geoip ? geoip.city : ''
  const userState = user && user.address ? user.address.state : geoip ? geoip.regionName : ''

  return html()`
    <div class="tabs">
      <ul>
        <li class="${!query.order || query.order === 'all' ? 'is-active' : ''}"><a href="${`/legislation?${makeFilterQuery('all', query)}`}">All</a></li>
        <li class="${query.order === 'congress' ? 'is-active' : ''}"><a href="${`/legislation?${makeFilterQuery('congress', query)}`}">Congress</a></li>
        <li class="${query.order === 'state' ? 'is-active' : ''}"><a href="${`/legislation?${makeFilterQuery('state', query)}`}">${userState}</a></li>
        <li class="${query.order === 'city' ? 'is-active' : ''}"><a href="${`/legislation?${makeFilterQuery('city', query)}`}">${userCity}</a></li>      </ul>
    </div>
    <div class="columns">
      <div class="column">
        <p class="has-text-grey is-size-6">${orderDescriptions[query.order || 'all']}</p>
      </div>
      <div class="column has-text-right has-text-left-mobile">
        ${filterForm(geoip, legislatures, storage, location, user, dispatch)}
      </div>
    </div>
  `
}

const measureListRow = (s) => {
  const next_action_at = s.next_agenda_action_at || s.next_agenda_begins_at
  const measureUrl = s.author_username ? `/${s.author_username}/legislation/${s.short_id}` : `/legislation/${s.short_id}`

  return `
    <div class="card highlight-hover">
      <div class="card-content">
        <div class="columns">
          <div class="column">
            <h3><a href="${measureUrl}">${s.title}</a></h3>
            ${s.introduced_at ? [`
            <div class="is-size-7 has-text-grey">
              <strong class="has-text-grey">${s.type} ${s.number}</strong>
              &mdash;
              ${s.sponsor_first_name
                ? [`Introduced by&nbsp;<a href=${`/${s.sponsor_username}`}>${s.sponsor_first_name} ${s.sponsor_last_name}</a>&nbsp;on ${(new Date(s.introduced_at)).toLocaleDateString()}`]
                : [`Introduced on ${(new Date(s.introduced_at)).toLocaleDateString()}`]
              }
              ${s.summary ? [`
                <p class="is-hidden-tablet"><strong class="has-text-grey">Has summary</strong></p>
              `] : []}
              <p><strong class="has-text-grey">Status:</strong>
              ${next_action_at ? [`
                Scheduled for House floor action ${!s.next_agenda_action_at ? 'during the week of' : 'on'} ${new Date(next_action_at).toLocaleDateString()}
                <br />
              `] : `${s.status}</p>`}
              <strong class="has-text-grey">Last action:</strong> ${new Date(s.last_action_at).toLocaleDateString()}
            </div>
            `] : [`
              <div class="is-size-7 has-text-grey">
                ${s.author_username
                  ? `Authored by <a href="${`/${s.author_username}`}">${s.author_first_name} ${s.author_last_name}</a>`
                  : `Authored by Anonymous`}
                on ${(new Date(s.created_at)).toLocaleDateString()}
              </div>
            `]}
          </div>
          <div class="column is-one-quarter has-text-right-tablet has-text-left-mobile">
            ${voteButton(s)}
            ${s.summary ? summaryTooltipButton(s.id, s.short_id, s.summary) : ''}
          </div>
        </div>
      </div>
    </div>
  `
}

const initialize = (prevQuery, location, storage, user) => (dispatch) => {
  const { query, url } = location

  if (prevQuery === url) return dispatch({ type: 'loaded' })
  const terms = query.terms && query.terms.replace(/[^\w\d ]/g, '').replace(/(hr|s) (\d+)/i, '$1$2').replace(/(\S)\s+(\S)/g, '$1 & $2')
  const fts = terms ? `&tsv=fts(simple).${encodeURIComponent(terms)}` : ''

  const recently_introduced = query.recently_introduced || storage.get('recently_introduced')
  const exec_action = query.exec_action || storage.get('exec_action')
  const floor_action = query.floor_action || storage.get('floor_action')
  const committee_action = query.committee_action || storage.get('committee_action')
  const userCity = user && user.address ? user.address.city : ''
  const userState = user && user.address ? user.address.state : ''
  const lastAction = recently_introduced === 'on' && from_leg_body === 'on' ? 'introduced_at' : recently_introduced === 'on' && from_liquid === 'on' ? 'created_at' : (exec_action === 'on' || floor_action === 'on' || committee_action === 'on') ? 'last_action_at' : 'last_action_at'
console.log(userState)

  const orders = {
    all: `&published=is.true&order=created_at.desc.nullslast`,
    congress: `&published=is.true&congress=not.is.null&order=${lastAction}.desc.nullslast`,
    state: `&published=is.true&legislature_name=eq.${userState}&order=${lastAction}.desc.nullslast`,
    city:
    `&published=is.true&legislature_name=eq.${userCity}, ${userState}&order=${lastAction}.desc.nullslast`,
  }
    const committeeStatus = committee_action === 'on' ? 'Committee Consideration,Awaiting floor or committee vote,Pending Committee' : ''
    const floorStatus = floor_action === 'on' ? 'Passed One Chamber,Failed One Chamber,Passed Both Chambers,Resolving Differences,To Executive,Pending Executive Calendar' : ''
    const execStatus = exec_action === 'on' ? 'Enacted,Veto Actions,Withdrawn,Failed or Returned to Executive' : ''


  const order = orders[query.order || 'all']
const status_query = committee_action === 'on' && floor_action === 'on' && exec_action && recently_introduced === 'on' ? `&status=in.(${committeeStatus},${floorStatus},${execStatus},Introduced)` : floor_action === 'on' && exec_action === 'on' && recently_introduced === 'on' ? `&status=in.(${floorStatus},${execStatus},Introduced)` : committee_action === 'on' && floor_action === 'on' && exec_action === 'on' ? `&status=in.(${floorStatus},${committeeStatus},${execStatus})` : committee_action === 'on' && recently_introduced === 'on' && exec_action === 'on' ? `&status=in.(Introduced,${committeeStatus},${execStatus})` : floor_action === 'on' && committeeStatus === 'on' && recently_introduced === 'on' ? `&status=in.(${floorStatus},${committeeStatus},Introduced)` : committee_action === 'on' && exec_action === 'on' ? `&status=in.(${execStatus},${committeeStatus})` : recently_introduced === 'on' && exec_action === 'on' ? `&status=in.(Introduced,${committeeStatus})` : committee_action === 'on' && exec_action === 'on' ? `&status=in.(${execStatus},Introduced)` : committee_action === 'on' && floor_action === 'on' ? `&status=in.(${floorStatus},${committeeStatus})` : floor_action === 'on' && exec_action === 'on' ? `&status=in.(${floorStatus},${execStatus})` : floor_action === 'on' && recently_introduced === 'on' ? `&status=in.(${floorStatus},Introduced)` : floor_action === 'on' ? `&status=in.(${floorStatus})` : recently_introduced === 'on' ? `&status=in.(Introduced)` : exec_action === 'on' ? `&status=in.(${execStatus})` : committee_action === 'on' ? `&status=in.(${committeeStatus})` : `&status=in.(${committeeStatus},${floorStatus},${execStatus},Introduced)`
  const from_liquid = query.from_liquid || storage.get('from_liquid')
  const from_leg_body = query.from_leg_body || storage.get('from_leg_body')
  const from_liquid_query = from_liquid === 'on' ? '&introduced_at=is.null' : ''
  const from_leg_body_query = from_leg_body === 'on' ? '&introduced_at=is.not.null' : ''
  const nominations = query.nominations || storage.get('nominations')
  const nominations_query = nominations === 'on' ? '&type=in.(PN)' : ''
  const bills = query.bills || storage.get('bills')
  const bills_query = bills === 'on' ? '&type=in.(HR,S,AB,SB)' : ''

  const fields = [
    'title', 'number', 'type', 'short_id', 'id', 'status',
    'sponsor_username', 'sponsor_first_name', 'sponsor_last_name',
    'introduced_at', 'last_action_at', 'next_agenda_begins_at', 'next_agenda_action_at',
    'summary', 'legislature_name', 'published', 'created_at', 'author_first_name', 'author_last_name', 'author_username',
  ]

  if (user) fields.push('vote_position', 'delegate_rank', 'delegate_name')
  const api_url = `/measures_detailed?select=${fields.join(',')}${from_liquid_query}${from_leg_body_query}${status_query}${nominations_query}${bills_query}${fts}${order}&limit=40`
  console.log(api_url)

  return api(api_url, { storage }).then((measures) => dispatch({
    type: 'receivedMeasures',
    measures: measures.reduce((b, a) => Object.assign(b, { [a.short_id]: a }), {}),
    measuresList: measures.map(({ short_id }) => short_id),
  }))
  .catch(error => {
    console.log(error)
    dispatch({ type: 'error', error })
  })
  .then(() => dispatch({ type: 'loaded' }))
}

const votePositionClass = (position) => {
  if (position === 'yea') return 'is-success'
  if (position === 'nay') return 'is-danger'
  return ''
}

const voteButton = (s) => {
  let voteBtnTxt = 'Vote'
  let voteBtnClass = 'button is-small is-outlined is-primary'
  let voteBtnIcon = 'fas fa-edit'
  if (s.vote_position) {
    const position = `${s.vote_position[0].toUpperCase()}${s.vote_position.slice(1)}`
    if (s.vote_position === 'yea') voteBtnIcon = 'fa fa-check'
    if (s.vote_position === 'nay') voteBtnIcon = 'fa fa-times'
    if (s.vote_position === 'abstain') voteBtnIcon = 'far fa-circle'
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
  return [`<a style="white-space: inherit; height: auto;" class="${voteBtnClass} href=${`/legislation/${s.short_id}`}">
    <span class="icon" style="align-self: flex-start;"><i class="${voteBtnIcon}"></i></span>
    <span class="has-text-weight-semibold">${voteBtnTxt}</span>
  </a>`]
}

const proposeButton = () => [`
  <a class="button is-primary" href="/legislation/propose">
    <span class="icon"><i class="fa fa-file"></i></span>
    <span class="has-text-weight-semibold">Propose Legislation</span>
  </a>
`]

const summaryTooltipButton = (id, short_id, summary) => [`
  <a href="${`/legislation/${short_id}`}" class="is-hidden-mobile">
    <br />
    <br />
    <span class="icon summary-tooltip">
      <i class="fa fa-lg fa-info-circle has-text-grey-lighter"></i>
      <div class="summary-tooltip-content">${summary}</div>
      <div class="summary-tooltip-arrow"></div>
    </span>
  </a>
`]

const noBillsMsg = (from_liquid, from_leg_body, recently_introduced, committee_action, exec_action, floor_action) => html()`
<div>
${from_liquid === 'on' && from_leg_body === 'on' ? [`
  <p class="is-size-5">Please select either Liquid or Imported bills.
  </p>  `] :
  (recently_introduced === 'on' && committee_action === 'on') ? [`<p class="is-size-5">Please select a single last action type: Committee, Floor, or Executive.
    </p>`] :
from_leg_body === 'on' ? [`
  <p class="is-size-5">Liquid doesn't have this location's imported bill list yet, please change your selected criteria to view legislative items.

  </p>
`] : committee_action === 'on' || floor_action === 'on' || exec_action === 'on' ? [`
  <p class="is-size-5">Liquid proposals do not have recent actions. Please change your selected criteria to view legislative items.

  </p>
`] : [`
  <a href="/legislation/propose" class="button is-primary has-text-weight-semibold">
    <span class="icon"><i class="fa fa-file"></i></span>
    <span>Add the first policy proposal</span>
  </a>
`]}
</div>
`
