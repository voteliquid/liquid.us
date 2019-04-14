const { APP_NAME } = process.env
const { avatarURL, handleForm, html } = require('../helpers')
const legislatorScoreCard = require('./legislator-scorecard')

module.exports = (state, dispatch) => {
  const { location, profiles, user, reps } = state
  const profile = profiles[location.params.username]
  const { proxied, proxied_name } = profile
  const isMyRep = reps && reps.some(rep => rep.office_holder.username === profile.username)

  return html`
    <section class="section">
      <div class="container is-widescreen">
        ${isMyRep && !user ? html`
          <div class="notification is-info has-text-centered">
            This looks like one of your reps. <a href="/join"><strong>Join ${APP_NAME}</strong></a> to begin holding them accountable.
          </div>
        ` : []}
        ${isMyRep && user && !user.verified ? html`
          <div class="notification is-dark has-text-centered">
            This is one of your reps. <a href="/get_started"><strong>Verify your identity</strong></a> to begin holding them accountable.
          </div>
        ` : []}
        ${proxied_name ? html`
          <div class="notification is-info has-text-centered">
            Your proxy to ${proxied_name} has been saved.
          </div>
        ` : []}
        <div class="columns">
          <div class="column">
            <div class="media">
              <div class="media-left">
                <img src=${avatarURL(profile)} alt="avatar" width="128">
              </div>
              <div class="media-content">
                <h1 class="title">${profile.first_name} ${profile.last_name}</h1>
                <h2 class="subtitle is-6 has-text-grey">${profile.elected_office_name}</h2>
                <form onsubmit=${handleForm(dispatch, { type: 'proxy:addedProxyViaProfile', profile })} method="POST">
                  ${html`<button disabled=${proxied} type="submit" class="button">
                    <span class="icon is-small"><i class="far fa-handshake"></i></span>
                    <span>&nbsp;Prox${proxied ? 'ied' : 'y'} to ${profile.first_name}</span>
                  </button>`}
                  ${proxied ? html`
                    <div class="content is-size-7 has-text-left">
                      <p>Visit your <a href="/proxies">Proxies</a> page to manage.</p>
                    </div>
                  ` : ''}
                </form>
              </div>
            </div>
          </div>
          <div class="column is-half is-one-third-fullhd">
            ${legislatorScoreCard(profile)}
          </div>
        </div>
        ${latestVotesTable(location, profile, user)}
      </div>
    </section>
  `
}

const latestVotesTable = (location, profile, user) => {
  const { query } = location
  const page_size = 20
  const page = Number(query.page || 1)
  const has_prev_page = page > 1
  const has_next_page = profile.votes.length === page_size
  const order_by = query.order_by || 'date'
  const order = query.order || 'desc'
  const opposite_order = order === 'desc' ? 'asc' : 'desc'

  return html`
    <h3 class="title is-5">Latest Votes</h3>
    <table class="table is-responsive is-narrow is-fullwidth is-bordered is-striped">
      <thead>
        <tr>
          <style>
            .fa-sort-asc {
              position: relative;
              top: 4px;
            }
            .fa-sort-desc {
              position: relative;
              bottom: 3px;
            }
          </style>
          <th style="vertical-align: bottom;" rowspan="2">
            <a href=${setQuery(query, { order_by: 'date', order: order_by === 'date' ? opposite_order : 'desc' })}>
              <span>Date&nbsp;${order_by === 'date' ? html`<i class="${`fa ${order === 'asc' ? `fa-sort-asc` : `fa-sort-desc`}`}" style="display:inline;"></i></span>` : ''}
            </a>
          </th>
          <th style="vertical-align: bottom;" rowspan="2">Bill</th>
          <th style="vertical-align: bottom;" rowspan="2">Title</th>
          <th style="vertical-align: bottom;" class="has-text-centered" rowspan="2">Their Vote</th>
          <th class="has-text-centered" colspan="2">Constituents</th>
          ${user ? html`
            <th style="vertical-align: bottom;" class="has-text-centered" rowspan="2">Your Vote</th>
            <th style="vertical-align: bottom;" class="has-text-centered" rowspan="2">Your Proxy</th>
          ` : []}
        </tr>
        <tr>
          <th class="has-text-centered">
            <a href=${setQuery(query, { order_by: 'with_constituents', order: order_by === 'with_constituents' ? opposite_order : 'desc' })}>
              <span>With&nbsp;${order_by === 'with_constituents' ? html`<i class="${`fa ${order === 'asc' ? `fa-sort-asc` : `fa-sort-desc`}`}" style="display:inline;"></i></span>` : ''}
            </a>
          </th>
          <th class="has-text-centered">
            <a href=${setQuery(query, { order_by: 'against_constituents', order: order_by === 'against_constituents' ? opposite_order : 'desc' })}>
              <span>Against&nbsp;${order_by === 'against_constituents' ? html`<i class="${`fa ${order === 'asc' ? `fa-sort-asc` : `fa-sort-desc`}`}" style="display:inline;"></i></span>` : ''}
            </a>
          </th>
        </tr>
      </thead>
      <tbody>
        ${profile.votes.length
          ? profile.votes.map(vote => latestVotesTableRow({ profile, vote, user }))
          : html`<tr><td colspan="9">No legislation to display.</td></tr>`
        }
      </tbody>
    </table>
    <div class="has-text-right-tablet has-text-left-mobile">
      ${has_prev_page ? html`<a href=${setQuery(query, { page: page - 1 })} class="button">Previous page</a>` : ''}
      ${has_next_page ? html`<a href=${setQuery(query, { page: page + 1 })} class="button">Next page</a>` : ''}
    </div>
  `
}

const latestVotesTableRow = ({ user, vote, profile }) => {
  return html`
    <tr>
      <td>${vote.rollcall_occurred_at_formatted}</td>
      <td>
        <a href=${`/legislation/${vote.measure_short_id}`}>
          <span class="responsive-bold">${formatBillTitle(vote.measure_short_id)}</span>
        </a>
      </td>
      <td>
        <a href=${`/legislation/${vote.measure_short_id}`}>
          ${vote.measure_title}
        </a>
      </td>
      <td class="has-text-centered"><span class="responsive-label">${profile.name} voted </span>${vote.legislator_position}</td>
      <td class="has-text-centered responsive-inline-block">
        <span class="responsive-label">With: </span>
        <span class=${vote.with_constituents === 0 && 'has-text-grey-lighter'}>${vote.with_constituents}</span>
      </td>
      <td class="has-text-centered responsive-inline-block">
        <span class="responsive-label">Against: </span>
        <span class=${vote.against_constituents === 0 ? 'has-text-grey-lighter' : (vote.against_constituents > vote.with_constituents ? 'has-text-danger has-text-weight-semibold' : '')}>${vote.against_constituents}</span>
      </td>
      ${user ? html`
        <td class="has-text-centered">
          <span class="responsive-label">${vote.current_user_vote_position ? 'You voted' : 'You did not vote'} </span>
          <span>${vote.current_user_vote_position || ''}</span>
        </td>
        <td style="white-space: nowrap;" class="has-text-centered responsive-inline-block">${
          vote.current_user_vote_delegate_name
            ? `
              <span class="responsive-label">${vote.current_user_vote_delegate_name ? 'Your vote was inherited from' : ''} </span>
              <span>${vote.current_user_vote_delegate_name || ''}</span>
              `
            : ''
        }</td>
      ` : []}
    </tr>
  `
}

function setQuery(query, values) {
  const q = Object.assign({}, query, values)
  return `?${Object.keys(q).filter(k => k).map(k => `${k}=${q[k]}`).join('&')}`
}

function formatBillTitle(short_id) {
  return short_id.slice(6).toUpperCase()
}
