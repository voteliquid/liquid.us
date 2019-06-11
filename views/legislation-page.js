const { html, capitalize } = require('../helpers')
const activityIndicator = require('./activity-indicator')

module.exports = (state, dispatch) => {
  const { cookies, geoip, loading, measures, measuresByUrl, location, user } = state
  const { query, url } = location


  return html`
    <div class="section">
      <div class="container is-widescreen">
        ${filterImages({ cookies, location, geoip, user })}
        ${filterForm(location, cookies, user, geoip, dispatch)}
        ${(!user || !user.address) && geoip ? [addAddressNotification(geoip, user)] : []}
        ${loading.measures || !measuresByUrl[url] ? activityIndicator() :
          (!measuresByUrl[url].length ? noBillsMsg(query.order, query) : measuresByUrl[url].map((shortId) => measureListRow(measures[shortId], query)))}
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

const addAddressNotification = (geoip = {}, user) => {
  return html`
    <p class="help">
      We guessed your location is <strong>${geoip.city}, ${geoip.regionName}.</strong><br />
      But this is only an approximation. <strong><a href="${user ? '/get_started/basics' : '/join'}">${user ? 'Go here' : 'Join'} to set your address</a></strong>.
    </p>
  `
}

const measureListRow = (s, query) => {
  const next_action_at = s.next_agenda_action_at || s.next_agenda_begins_at
  const measureUrl = s.author_username ? `/${s.author_username}/${s.short_id}` : `/legislation/${s.short_id}`
  const legName = s.legislature_name === 'U.S. Congress'
    ? 'Congress'
    : s.legislature_name.includes(',')
    ? s.legislature_name.split(',')[0]
    : s.legislature_name

  return html`
    <div class="card highlight-hover">
      <div class="card-content">
        <div class="columns">
          <div class="column">
            <h3><a href="${measureUrl}">${simplifyTitle(s.title)}</a></h3>
            ${s.introduced_at ? html`
              <div class="is-size-7 has-text-grey">
                <p>
                  <span class="has-text-weight-bold">${s.short_id.replace(/^[^-]+-(\D+)(\d+)/, '$1 $2').toUpperCase()}</span> &bullet;
                  ${s.policy_area ? html`
                    <a href=${`/legislation?${makeQuery({ policy_area: s.policy_area }, query)}`}>${s.policy_area}</a> •
                  ` : ''}
                  Introduced in ${legName}
                  ${s.sponsor_first_name ? html`
                    by <a href=${`/${s.sponsor_username}`}>${s.sponsor_first_name} ${s.sponsor_last_name}</a>
                  ` : ''}
                  on ${(new Date(s.introduced_at)).toLocaleDateString()}
                </p>
                ${s.summary ? html`
                  <p class="is-hidden-tablet"><strong class="has-text-grey">Has summary</strong></p>
                ` : ''}
                <p>
                  <strong class="has-text-grey">Status:</strong>
                  ${next_action_at ? html`
                    Scheduled for House floor action ${!s.next_agenda_action_at ? 'during the week of' : 'on'} ${new Date(next_action_at).toLocaleDateString()}
                  ` : s.status}
                </p>
                <p><strong class="has-text-grey">Last action:</strong> ${new Date(s.last_action_at).toLocaleDateString()}</p>
              </div>
            ` : html`
              <div class="is-size-7 has-text-grey">
                ${s.author_username
                  ? html`Authored for Liquid ${legName} by <a href="${`/${s.author_username}`}">${s.author_first_name} ${s.author_last_name}</a>`
                  : html`Authored for Liquid ${legName} by Anonymous`
                }
                on ${(new Date(s.created_at)).toLocaleDateString()}
              </div>
            `}
          </div>
          <div class="column is-one-quarter has-text-right-tablet has-text-left-mobile">
            ${voteButton(s, measureUrl)}
            ${s.summary ? summaryTooltipButton(measureUrl, s.summary) : ''}
          </div>
        </div>
      </div>
    </div>
  `
}

const toggleFilter = (cookies, dispatch, filterName) => (event) => {
  const btn = document.querySelector('.filter-submit')
  if (btn.disabled) {
    event.preventDefault()
  } else {
    if (event.currentTarget && event.currentTarget.checked) {
      dispatch({ type: 'cookieSet', key: `${filterName}` })
    } else {
      dispatch({ type: 'cookieUnset', key: `${filterName}` })
    }
    btn.click()
  }
}
const simplifyTitle = (title) => {
  return capitalize(title.replace(/^Relating to: /, ''))
}

const votePositionClass = (position) => {
  if (position === 'yea') return 'is-success'
  if (position === 'nay') return 'is-danger'
  return ''
}

const voteButton = (s, measureUrl) => {
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
  return html`<a style="white-space: inherit; height: auto;" class="${voteBtnClass}" href="${measureUrl}">
    <span class="icon" style="align-self: flex-start;"><i class="${voteBtnIcon}"></i></span>
    <span class="has-text-weight-semibold">${voteBtnTxt}</span>
  </a>`
}

const summaryTooltipButton = (measureUrl, summary) => html`
  <a href="${measureUrl}" class="is-hidden-mobile">
    <br />
    <br />
    <span class="icon summary-tooltip">
      <i class="fa fa-lg fa-info-circle has-text-grey-lighter"></i>
      <div class="summary-tooltip-content">${{ html: summary }}</div>
      <div class="summary-tooltip-arrow"></div>
    </span>
  </a>
`

const noBillsMsg = (order, query) => html`
  <div>
    ${query.imported && query.liquid ? html`
      <p>We have not imported bills for this area and no items have been added to Liquid.</p><br />
      <p>Please email <a href="mailto:support@liquid.us" target="_blank">support@liquid.us</a> to request that we import bills from this location, <a href="/legislation/propose">propose a bill,</a> or toggle your filters.</p>
    ` : query.imported ? html`
      <p>Either no bills have the selected status or Liquid doesn't have this legislature's bill list yet.</p><br />
      <p>Please email <a href="mailto:support@liquid.us" target="_blank">support@liquid.us</a> to request we import bills from this location, or change your selected criteria.</p>
    ` : html`
      <p>No bills have been introduced on Liquid in this area. <a href="/legislation/propose">Propose a bill</a> or change your selected criteria.</p>
    `}
  </div>
`

const updateFilter = (event, location, userState, state, userCity, city, dispatch) => {
  event.preventDefault()
  const formData = require('parse-form').parse(event.target).body
  const formUrl = `${location.path}?${Object.keys(formData).map((key) => {
    if (key === 'city') { return `city=${formData[key] === 'on' ? `${userCity}` : city}` }
    if (key === 'state') { return `state=${formData[key] === 'on' ? `${userState}` : state}` }
    return `${key}=${formData[key]}`
  }).join('&')}`
  dispatch({ type: 'redirected', url: formUrl })
}

const filterForm = (location, cookies, user, geoip, dispatch) => {
  const congress = location.query.congress || cookies.congress
  const state = location.query.state || cookies.state
  const city = location.query.city || cookies.city
  const liquid_introduced = location.query.liquid_introduced || cookies.liquid_introduced
  const imported = location.query.imported || cookies.imported
  const userState = user && user.address ? user.address.state : geoip ? geoip.region : ''
  const userCity = `${user && user.address ? user.address.city : geoip ? geoip.city : ''}, ${userState}`

  return html`
    <form name="legislation_filters" class="is-inline-block" method="GET" action="/legislation" onsubmit="${(e) => updateFilter(e, location, userState, state, userCity, city, dispatch)}">
      <input name="policy_area" type="hidden" value="${location.query.policy_area}" />
      <input type="checkbox" onclick=${toggleFilter(cookies, dispatch, 'congress', 'on')} name="congress" checked=${!!congress} class="is-hidden" />
      <input type="checkbox" onclick=${toggleFilter(cookies, dispatch, 'state', 'on')} name="state" checked=${!!state} class="is-hidden" />
      <input type="checkbox" onclick=${toggleFilter(cookies, dispatch, 'city', 'on')} name="city" checked=${!!city} class="is-hidden" />
      <input type="checkbox" onclick=${toggleFilter(cookies, dispatch, 'liquid_introduced', 'on')} name="liquid_introduced" checked=${!!liquid_introduced} class="is-hidden" />
      <input type="checkbox" onclick=${toggleFilter(cookies, dispatch, 'imported', 'on')} name="imported" checked=${!!imported} class="is-hidden" />
      ${location.query.policy_area ? html`
        <div class="control" style="margin-bottom: 10px;">
          <label class="checkbox has-text-grey">
            <input onclick=${removePolicyArea} type="checkbox" checked />
            <span class="has-text-weight-semibold">Policy area:&nbsp;</span> ${location.query.policy_area.replace(/%20/g, ' ')}
          </label>
        </div>
      ` : ''}
      <button type="submit" class="filter-submit is-hidden">Update</button>
    </form>
  `
}
const makeQuery = (newFilters, oldQuery) => {
  const newQuery = Object.assign({}, oldQuery, newFilters, { terms: oldQuery.terms || '' })
  return Object.keys(newQuery).map(key => {
    return `${key}=${newQuery[key]}`
  }).join('&')
}
const removePolicyArea = (event) => {
  event.preventDefault()
  document.querySelector('[name=policy_area]').value = ''
  document.querySelector('.filter-submit').click()
}


const toggleCongress = () => {
  document.querySelector('[name="congress"]').click()
}
const toggleState = () => {
  document.querySelector('[name="state"]').click()
}
const toggleCity = () => {
  document.querySelector('[name="city"]').click()
}
const toggleImported = () => {
  document.querySelector('[name="imported"]').click()
}
const toggleLiquid = () => {
  document.querySelector('[name="liquid_introduced"]').click()
}
const filterImages = ({ location, cookies, geoip, user }) => {
  const userState = user && user.address ? user.address.state : geoip ? geoip.region : ''
  const congress = location.query.congress || cookies.congress
  const state = location.query.state || cookies.state
  const city = location.query.city || cookies.city
  const stateName = state ? `${state}` : userState
  const liquid = location.query.liquid_introduced || cookies.liquid_introduced
  const imported = location.query.imported || cookies.imported
  const userCity = `${user && user.address ? user.address.city : geoip ? geoip.city : ''}`

  return html`
  <div class="columns filters" style="border-top: 1px solid #ccc; margin-bottom: 0;">
    <div class="column is-narrow filter-heading"><h3 class="title is-6">Filter bill source</h3></div>
    <div class="column filter-image">
      <button onclick="${toggleLiquid}" class=${`button is-outlined ${liquid ? 'filter-on' : 'filter-off'}`}>
        <span class="image is-16x16"><img src="/assets/filter-images/liquid.png" /></span>
        <span class="has-text-weight-semibold">&nbsp;Liquid</span>
      </button>
      <button onclick="${toggleImported}"  class=${`button is-outlined ${imported ? 'filter-on' : 'filter-off'}`}>
        <span class="image"><img style="width: auto; height: 23px;" src="/assets/filter-images/legislature.png" /></span>
        <span class="has-text-weight-semibold">&nbsp;Legislature</span>
      </button>
    </div>
    <div class="column is-narrow filter-heading"><h3 class="title is-6">Location</h3></div>
    <div class="column filter-image">
      <button onclick="${toggleCongress}"  class=${`button is-outlined ${congress ? 'filter-on' : 'filter-off'}`}>
        <span class="image" style="width: 21px;"><img src="/assets/filter-images/US.png" /></span>
        <span class="has-text-weight-semibold">&nbsp;U.S.</span>
      </button>
      <button onclick="${toggleState}"  class=${`button is-outlined ${state ? 'filter-on' : 'filter-off'}`}>
        <span class="image is-16x16"><img src="/assets/filter-images/WI.png" /></span>
        <span class="has-text-weight-semibold">&nbsp;${stateName}</span>
      </button>
      <button onclick="${toggleCity}"  class=${`button is-outlined ${city ? 'filter-on' : 'filter-off'}`}>
        <span class="image is-16x16"><img src="/assets/filter-images/local.png" /></span>
        <span class="has-text-weight-semibold">&nbsp;${userCity}</span>
      </button>
    </div>
  </div>
  <style>
    .filters {
      padding-top: 10px;
    }
    .filter-heading {
      padding-top: 1.25rem;
    }
    .filter-on {
      border-color: #565656;
    }
    .filter-on:hover {
      border-color: #565656;
      background-color: #f7f7f7;
    }
    .filter-off {
      filter: grayscale(100%);
      opacity: 0.5;
    }
    @media (max-width: 1050px) {
      .filters {
        padding-top: 0px;
      }
      .filter-heading {
        padding-bottom: .3rem;
        padding-top: .7rem;
      }
      .filter-image {
        padding-bottom: 0rem;
        padding-top: 0rem;
      }
    }
  </style>
  `
  }
